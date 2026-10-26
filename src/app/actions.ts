"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, getUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type FormState = { error?: string; ok?: string } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(3, "Ism kamida 3 ta harf bo'lsin"),
  email: z.string().trim().toLowerCase().email("Email noto'g'ri"),
  phone: z.string().trim().optional(),
  password: z.string().min(6, "Parol kamida 6 belgi bo'lsin"),
  role: z.enum(["STUDENT", "TEACHER"]),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, phone, password, role } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Bu email allaqachon ro'yxatdan o'tgan" };
  const user = await db.user.create({
    data: { name, email, phone: phone || null, role, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  redirect(role === "TEACHER" ? "/kabinet/ustoz" : "/kabinet");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "Email yoki parol noto'g'ri" };
  await createSession(user.id);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/") ? next : "/kabinet");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const teacherSchema = z.object({
  headline: z.string().trim().min(5, "Qisqa tavsif kamida 5 belgi"),
  bio: z.string().trim().min(20, "O'zingiz haqingizda kamida 20 belgi yozing"),
  city: z.string().min(2),
  experienceYears: z.coerce.number().int().min(0).max(60),
  pricePerHour: z.coerce.number().int().min(0),
  format: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
});

export async function saveTeacherProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/kabinet/ustoz");
  const parsed = teacherSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const subjectIds = form.getAll("subjects").map(String);
  if (subjectIds.length === 0) return { error: "Kamida bitta fan tanlang" };
  const subjects = subjectIds.map((id) => ({ id }));
  await db.teacherProfile.upsert({
    where: { userId: user.id },
    create: { ...parsed.data, userId: user.id, subjects: { connect: subjects } },
    update: { ...parsed.data, subjects: { set: subjects } },
  });
  await db.user.update({ where: { id: user.id }, data: { role: user.role === "STUDENT" ? "TEACHER" : user.role, city: parsed.data.city } });
  revalidatePath("/ustozlar");
  return { ok: "Profil saqlandi" };
}

export async function enroll(form: FormData) {
  const courseId = String(form.get("courseId"));
  const provider = z.enum(["PAYME", "CLICK", "UZUM"]).catch("PAYME").parse(form.get("provider"));
  const course = await db.course.findUniqueOrThrow({ where: { id: courseId }, include: { lessons: { orderBy: { order: "asc" }, take: 1 } } });
  const user = await requireUser(`/kurslar/${course.slug}`);
  const existing = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (!existing) {
    // Demo: to'lov darhol muvaffaqiyatli deb belgilanadi. Haqiqiy Payme/Click integratsiyasi shu yerga ulanadi.
    await db.enrollment.create({
      data: {
        userId: user.id,
        courseId,
        payment: course.price > 0 ? { create: { userId: user.id, amount: course.price, provider, status: "PAID" } } : undefined,
      },
    });
  }
  revalidatePath(`/kurslar/${course.slug}`);
  redirect(course.lessons[0] ? `/kurslar/${course.slug}/dars/${course.lessons[0].order}` : `/kurslar/${course.slug}`);
}

function certCode() {
  return "UZ-" + randomBytes(4).toString("hex").toUpperCase();
}

export async function completeLesson(form: FormData) {
  const lessonId = String(form.get("lessonId"));
  const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId }, include: { course: { include: { lessons: true } } } });
  const user = await requireUser(`/kurslar/${lesson.course.slug}`);
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } } });
  if (!enrollment) redirect(`/kurslar/${lesson.course.slug}`);

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId },
    update: {},
  });

  const done = await db.lessonProgress.count({ where: { userId: user.id, lesson: { courseId: lesson.courseId } } });
  if (done >= lesson.course.lessons.length && !enrollment.completedAt) {
    await db.$transaction([
      db.enrollment.update({ where: { id: enrollment.id }, data: { completedAt: new Date() } }),
      db.certificate.create({ data: { code: certCode(), title: lesson.course.title, userId: user.id, courseId: lesson.courseId } }),
    ]);
  }

  const next = lesson.course.lessons.filter((l) => l.order > lesson.order).sort((a, b) => a.order - b.order)[0];
  revalidatePath("/kabinet");
  redirect(next ? `/kurslar/${lesson.course.slug}/dars/${next.order}` : `/kurslar/${lesson.course.slug}?tugadi=1`);
}

export async function submitTest(form: FormData) {
  const testId = String(form.get("testId"));
  const test = await db.test.findUniqueOrThrow({ where: { id: testId }, include: { questions: { include: { options: true } } } });
  const user = await requireUser(`/testlar/${test.slug}`);

  const answers: Record<string, string> = {};
  let score = 0;
  for (const q of test.questions) {
    const picked = form.get(`q_${q.id}`);
    if (typeof picked === "string") {
      answers[q.id] = picked;
      if (q.options.find((o) => o.id === picked)?.isCorrect) score++;
    }
  }
  const total = test.questions.length;
  const passed = total > 0 && (score / total) * 100 >= test.passPercent;

  const attempt = await db.testAttempt.create({
    data: {
      userId: user.id,
      testId,
      score,
      total,
      passed,
      answers,
      certificate: passed ? { create: { code: certCode(), title: test.title, userId: user.id, courseId: test.courseId } } : undefined,
    },
  });
  redirect(`/testlar/${test.slug}/natija/${attempt.id}`);
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Baho tanlang").max(5),
  comment: z.string().trim().min(5, "Sharh kamida 5 belgi bo'lsin"),
  target: z.enum(["teacher", "center", "course"]),
  targetId: z.string().min(1),
  path: z.string(),
});

export async function addReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Sharh qoldirish uchun tizimga kiring" };
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { rating, comment, target, targetId, path } = parsed.data;
  const key = `${target}Id` as "teacherId" | "centerId" | "courseId";

  if (target === "teacher" && user.teacher?.id === targetId) return { error: "O'zingizga sharh qoldira olmaysiz" };

  const existing = await db.review.findFirst({ where: { authorId: user.id, [key]: targetId } });
  if (existing) await db.review.update({ where: { id: existing.id }, data: { rating, comment } });
  else await db.review.create({ data: { authorId: user.id, rating, comment, [key]: targetId } });

  const agg = await db.review.aggregate({ where: { [key]: targetId }, _avg: { rating: true }, _count: true });
  const stats = { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count };
  if (target === "teacher") await db.teacherProfile.update({ where: { id: targetId }, data: stats });
  if (target === "center") await db.center.update({ where: { id: targetId }, data: stats });
  if (target === "course") await db.course.update({ where: { id: targetId }, data: stats });

  revalidatePath(path);
  return { ok: "Rahmat! Sharhingiz saqlandi" };
}

export async function bookTeacher(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Darsga yozilish uchun tizimga kiring" };
  const teacherId = String(form.get("teacherId"));
  if (user.teacher?.id === teacherId) return { error: "O'zingizga dars buyurtma qila olmaysiz" };
  const date = new Date(String(form.get("date")));
  if (isNaN(date.getTime()) || date < new Date()) return { error: "Kelajakdagi sana va vaqtni tanlang" };
  const message = String(form.get("message") ?? "").trim();
  await db.booking.create({ data: { studentId: user.id, teacherId, date, message: message || "—" } });
  revalidatePath("/kabinet");
  return { ok: "So'rov yuborildi! Ustoz tez orada javob beradi." };
}

export async function updateBooking(form: FormData) {
  const user = await requireUser("/kabinet/ustoz");
  const id = String(form.get("id"));
  const status = z.enum(["ACCEPTED", "DECLINED", "DONE"]).parse(form.get("status"));
  await db.booking.updateMany({ where: { id, teacher: { userId: user.id } }, data: { status } });
  revalidatePath("/kabinet/ustoz");
}
