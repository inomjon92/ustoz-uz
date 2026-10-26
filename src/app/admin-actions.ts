"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { recomputeRating } from "@/lib/ratings";
import type { FormState } from "./actions";

export async function setUserRole(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  const role = z.enum(["STUDENT", "TEACHER", "CENTER_ADMIN", "ADMIN"]).parse(form.get("role"));
  if (id === admin.id && role !== "ADMIN") return; // o'zini adminlikdan chiqarib qo'ymaslik uchun
  await db.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/foydalanuvchilar");
}

export async function deleteUser(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  if (id === admin.id) return;
  await db.user.delete({ where: { id } });
  revalidatePath("/admin/foydalanuvchilar");
}

export async function toggleTeacherVerified(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const t = await db.teacherProfile.findUniqueOrThrow({ where: { id } });
  await db.teacherProfile.update({ where: { id }, data: { verified: !t.verified } });
  revalidatePath("/admin/ustozlar");
  revalidatePath("/ustozlar");
}

const centerSchema = z.object({
  name: z.string().trim().min(3, "Markaz nomi kamida 3 belgi"),
  city: z.string().min(2),
  address: z.string().trim().min(3, "Manzilni kiriting"),
  phone: z.string().trim().min(7, "Telefon raqamini kiriting"),
  description: z.string().trim().min(10, "Tavsif kamida 10 belgi"),
  ownerEmail: z.string().trim().toLowerCase().email("Egasining emaili noto'g'ri").or(z.literal("")),
});

export async function createCenter(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = centerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { ownerEmail, ...data } = parsed.data;
  let ownerId: string | null = null;
  if (ownerEmail) {
    const owner = await db.user.findUnique({ where: { email: ownerEmail } });
    if (!owner) return { error: "Bu email bilan foydalanuvchi topilmadi. Avval u ro'yxatdan o'tsin." };
    ownerId = owner.id;
    if (owner.role === "STUDENT") await db.user.update({ where: { id: owner.id }, data: { role: "CENTER_ADMIN" } });
  }
  const subjects = form.getAll("subjects").map((id) => ({ id: String(id) }));
  await db.center.create({
    data: { ...data, ownerId, verified: true, slug: `${slugify(data.name) || "markaz"}-${Date.now().toString(36)}`, subjects: { connect: subjects } },
  });
  revalidatePath("/admin/markazlar");
  revalidatePath("/markazlar");
  return { ok: "Markaz qo'shildi" };
}

export async function toggleCenterVerified(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const c = await db.center.findUniqueOrThrow({ where: { id } });
  await db.center.update({ where: { id }, data: { verified: !c.verified } });
  revalidatePath("/admin/markazlar");
}

export async function deleteCenter(form: FormData) {
  await requireAdmin();
  await db.center.delete({ where: { id: String(form.get("id")) } });
  revalidatePath("/admin/markazlar");
  revalidatePath("/markazlar");
}

export async function createSubject(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const icon = String(form.get("icon") ?? "").trim() || "📘";
  if (name.length < 2) return { error: "Fan nomini kiriting" };
  const slug = slugify(name) || `fan-${Date.now().toString(36)}`;
  if (await db.subject.findUnique({ where: { slug } })) return { error: "Bunday fan allaqachon bor" };
  await db.subject.create({ data: { name, icon, slug } });
  revalidatePath("/admin/fanlar");
  return { ok: "Fan qo'shildi" };
}

export async function deleteSubject(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const used = await db.subject.findUniqueOrThrow({ where: { id }, include: { _count: { select: { courses: true, tests: true } } } });
  if (used._count.courses + used._count.tests > 0) redirect("/admin/fanlar?xato=band");
  await db.subject.delete({ where: { id } });
  revalidatePath("/admin/fanlar");
}

export async function deleteReview(form: FormData) {
  await requireAdmin();
  const r = await db.review.delete({ where: { id: String(form.get("id")) } });
  if (r.teacherId) await recomputeRating("teacherId", r.teacherId);
  if (r.centerId) await recomputeRating("centerId", r.centerId);
  if (r.courseId) await recomputeRating("courseId", r.courseId);
  revalidatePath("/admin/sharhlar");
}

/** Barcha ma'lumotlarni o'chiradi; faqat adminlar va fanlar qoladi */
export async function wipeDatabase(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  if (String(form.get("confirm")).trim() !== "TOZALASH") return { error: "Tasdiqlash uchun TOZALASH so'zini yozing" };
  await db.$transaction([
    db.booking.deleteMany(), db.payment.deleteMany(), db.certificate.deleteMany(), db.testAttempt.deleteMany(),
    db.option.deleteMany(), db.question.deleteMany(), db.test.deleteMany(), db.review.deleteMany(),
    db.lessonProgress.deleteMany(), db.enrollment.deleteMany(), db.lesson.deleteMany(), db.course.deleteMany(),
    db.center.deleteMany(), db.teacherProfile.deleteMany(), db.user.deleteMany({ where: { role: { not: "ADMIN" } } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: "Baza tozalandi. Fanlar va admin hisoblari saqlab qolindi." };
}
