"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canEditCourse, requireUser, type SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import type { FormState } from "./actions";

const courseSchema = z.object({
  title: z.string().trim().min(5, "Kurs nomi kamida 5 belgi"),
  summary: z.string().trim().min(10, "Qisqa tavsif kamida 10 belgi"),
  description: z.string().trim().min(20, "To'liq tavsif kamida 20 belgi"),
  subjectId: z.string().min(1, "Fanni tanlang"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  format: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  price: z.coerce.number().int().min(0, "Narx manfiy bo'lmasin"),
  durationWeeks: z.coerce.number().int().min(1).max(104),
});

function uniqueSlug(text: string) {
  return `${slugify(text).slice(0, 60) || "item"}-${randomBytes(2).toString("hex")}`;
}

async function guardCourse(user: SessionUser, courseId: string) {
  if (!(await canEditCourse(user, courseId))) throw new Error("Bu kursni tahrirlashga ruxsat yo'q");
}

function refresh(courseId?: string) {
  revalidatePath("/kurslar");
  revalidatePath("/kabinet/ustoz/kurslar");
  if (courseId) revalidatePath(`/kabinet/ustoz/kurslar/${courseId}`);
}

export async function createCourse(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const parsed = courseSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Muallif: ustoz profili yoki foydalanuvchiga tegishli markaz
  const owner = String(form.get("owner") ?? "teacher");
  let teacherId: string | null = null;
  let centerId: string | null = null;
  if (owner.startsWith("center:")) {
    const center = await db.center.findFirst({ where: { id: owner.slice(7), ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) } });
    if (!center) return { error: "Markaz topilmadi" };
    centerId = center.id;
  } else {
    if (!user.teacher) return { error: "Avval ustoz profilingizni to'ldiring" };
    teacherId = user.teacher.id;
  }

  const course = await db.course.create({
    data: { ...parsed.data, slug: uniqueSlug(parsed.data.title), teacherId, centerId, published: false },
  });
  refresh();
  redirect(`/kabinet/ustoz/kurslar/${course.id}`);
}

export async function updateCourse(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const id = String(form.get("id"));
  await guardCourse(user, id);
  const parsed = courseSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.course.update({ where: { id }, data: parsed.data });
  refresh(id);
  return { ok: "Kurs saqlandi" };
}

export async function toggleCoursePublished(form: FormData) {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const id = String(form.get("id"));
  await guardCourse(user, id);
  const c = await db.course.findUniqueOrThrow({ where: { id }, include: { _count: { select: { lessons: true } } } });
  if (!c.published && c._count.lessons === 0) redirect(`/kabinet/ustoz/kurslar/${id}?xato=dars`);
  await db.course.update({ where: { id }, data: { published: !c.published } });
  refresh(id);
}

export async function deleteCourse(form: FormData) {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const id = String(form.get("id"));
  await guardCourse(user, id);
  await db.course.delete({ where: { id } });
  refresh();
  redirect(String(form.get("back") ?? "/kabinet/ustoz/kurslar"));
}

const lessonSchema = z.object({
  title: z.string().trim().min(3, "Dars nomi kamida 3 belgi"),
  content: z.string().trim().min(10, "Dars matni kamida 10 belgi"),
  videoUrl: z.string().trim().url("Video havolasi noto'g'ri").or(z.literal("")).optional(),
  minutes: z.coerce.number().int().min(1).max(600),
});

export async function saveLesson(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const courseId = String(form.get("courseId"));
  await guardCourse(user, courseId);
  const parsed = lessonSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = { ...parsed.data, videoUrl: parsed.data.videoUrl || null };
  const id = form.get("id");
  if (id) {
    await db.lesson.update({ where: { id: String(id), courseId }, data });
  } else {
    const last = await db.lesson.aggregate({ where: { courseId }, _max: { order: true } });
    await db.lesson.create({ data: { ...data, courseId, order: (last._max.order ?? 0) + 1 } });
  }
  refresh(courseId);
  return { ok: id ? "Dars saqlandi" : "Dars qo'shildi" };
}

export async function deleteLesson(form: FormData) {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const courseId = String(form.get("courseId"));
  await guardCourse(user, courseId);
  await db.lesson.delete({ where: { id: String(form.get("id")), courseId } });
  // Tartib raqamlarini qayta ketma-ket qilish (1, 2, 3 …)
  const rest = await db.lesson.findMany({ where: { courseId }, orderBy: { order: "asc" } });
  await db.$transaction([
    ...rest.map((l, i) => db.lesson.update({ where: { id: l.id }, data: { order: 1000 + i } })),
    ...rest.map((l, i) => db.lesson.update({ where: { id: l.id }, data: { order: i + 1 } })),
  ]);
  refresh(courseId);
}

const testSchema = z.object({
  title: z.string().trim().min(3, "Test nomi kamida 3 belgi"),
  description: z.string().trim().min(5, "Tavsif kamida 5 belgi"),
  durationMin: z.coerce.number().int().min(1).max(300),
  passPercent: z.coerce.number().int().min(1).max(100),
});

async function guardTest(user: SessionUser, testId: string) {
  const t = await db.test.findUniqueOrThrow({ where: { id: testId } });
  if (user.role === "ADMIN") return t;
  if (!t.courseId || !(await canEditCourse(user, t.courseId))) throw new Error("Bu testni tahrirlashga ruxsat yo'q");
  return t;
}

export async function createTest(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const parsed = testSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const courseId = String(form.get("courseId") ?? "");
  let subjectId = String(form.get("subjectId") ?? "");
  if (courseId) {
    await guardCourse(user, courseId);
    subjectId = (await db.course.findUniqueOrThrow({ where: { id: courseId } })).subjectId;
  } else if (user.role !== "ADMIN") {
    return { error: "Test kursga biriktirilishi kerak" };
  }
  if (!subjectId) return { error: "Fanni tanlang" };
  const test = await db.test.create({
    data: { ...parsed.data, slug: uniqueSlug(parsed.data.title), subjectId, courseId: courseId || null },
  });
  revalidatePath("/testlar");
  redirect(`/kabinet/ustoz/testlar/${test.id}`);
}

export async function updateTest(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const id = String(form.get("id"));
  await guardTest(user, id);
  const parsed = testSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.test.update({ where: { id }, data: parsed.data });
  revalidatePath(`/kabinet/ustoz/testlar/${id}`);
  revalidatePath("/testlar");
  return { ok: "Test saqlandi" };
}

export async function deleteTest(form: FormData) {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const id = String(form.get("id"));
  const t = await guardTest(user, id);
  await db.test.delete({ where: { id } });
  revalidatePath("/testlar");
  redirect(t.courseId ? `/kabinet/ustoz/kurslar/${t.courseId}` : "/admin/testlar");
}

export async function addQuestion(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const testId = String(form.get("testId"));
  await guardTest(user, testId);
  const text = String(form.get("text") ?? "").trim();
  if (text.length < 3) return { error: "Savol matnini yozing" };
  const options = [0, 1, 2, 3, 4, 5].map((i) => String(form.get(`option${i}`) ?? "").trim());
  const correctIdx = Number(form.get("correct"));
  if (!options[correctIdx]) return { error: "To'g'ri javobni belgilang (bo'sh bo'lmagan variant)" };
  const filled = options.map((t, i) => ({ text: t, isCorrect: i === correctIdx })).filter((o) => o.text);
  if (filled.length < 2) return { error: "Kamida 2 ta javob varianti kiriting" };
  const last = await db.question.aggregate({ where: { testId }, _max: { order: true } });
  await db.question.create({ data: { testId, text, order: (last._max.order ?? 0) + 1, options: { create: filled } } });
  revalidatePath(`/kabinet/ustoz/testlar/${testId}`);
  return { ok: "Savol qo'shildi" };
}

export async function deleteQuestion(form: FormData) {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const testId = String(form.get("testId"));
  await guardTest(user, testId);
  await db.question.delete({ where: { id: String(form.get("id")), testId } });
  revalidatePath(`/kabinet/ustoz/testlar/${testId}`);
}
