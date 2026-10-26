import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { db } from "./db";

const COOKIE = "ustoz_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // HTTPS orqali deploy qilinganda .env da COOKIE_SECURE="true" qo'ying
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const getUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, city: true, teacher: { select: { id: true } } },
    });
    // ADMIN_EMAILS ro'yxatidagi email egasi avtomatik admin bo'ladi
    if (user && user.role !== "ADMIN" && isAdminEmail(user.email)) {
      await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      user.role = "ADMIN";
    }
    return user;
  } catch {
    return null;
  }
});

export async function requireUser(next = "/kabinet") {
  const user = await getUser();
  if (!user) redirect(`/kirish?next=${encodeURIComponent(next)}`);
  return user;
}

export function isAdminEmail(email: string) {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") redirect("/kabinet");
  return user;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;

/** Kursni tahrirlash huquqi: kurs egasi ustoz, markaz egasi yoki admin */
export async function canEditCourse(user: SessionUser, courseId: string) {
  if (user.role === "ADMIN") return true;
  const c = await db.course.findUnique({ where: { id: courseId }, select: { teacher: { select: { userId: true } }, center: { select: { ownerId: true } } } });
  return !!c && (c.teacher?.userId === user.id || c.center?.ownerId === user.id);
}
