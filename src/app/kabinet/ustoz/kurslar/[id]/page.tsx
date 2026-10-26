import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canEditCourse, requireUser } from "@/lib/auth";
import { ActionForm, Submit } from "@/components/forms";
import { CourseFields, LessonFields, TestFields } from "@/components/content-fields";
import { createTest, deleteCourse, deleteLesson, saveLesson, toggleCoursePublished, updateCourse } from "@/app/content-actions";

export default async function EditCoursePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ xato?: string }> }) {
  const { id } = await params;
  const { xato } = await searchParams;
  const user = await requireUser(`/kabinet/ustoz/kurslar/${id}`);
  if (!(await canEditCourse(user, id))) notFound();
  const [course, subjects] = await Promise.all([
    db.course.findUnique({
      where: { id },
      include: { lessons: { orderBy: { order: "asc" } }, tests: { include: { _count: { select: { questions: true } } } }, _count: { select: { enrollments: true } } },
    }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!course) notFound();

  return (
    <div className="container-x py-10">
      <Link href={user.role === "ADMIN" ? "/admin/kurslar" : "/kabinet/ustoz/kurslar"} className="text-sm font-semibold text-brand-600">← Kurslar</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-sm text-slate-500">
            {course.published ? "✅ Chop etilgan, katalogda ko'rinadi" : "📝 Qoralama, faqat sizga ko'rinadi"} · {course._count.enrollments} o&apos;quvchi
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/kurslar/${course.slug}`} className="btn-ghost">Ko&apos;rish</Link>
          <form action={toggleCoursePublished}>
            <input type="hidden" name="id" value={course.id} />
            <Submit className={course.published ? "btn-ghost" : "btn-primary"}>{course.published ? "Katalogdan olish" : "Chop etish"}</Submit>
          </form>
        </div>
      </div>
      {xato === "dars" && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Chop etishdan oldin kamida bitta dars qo&apos;shing.</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="space-y-6">
          <div>
            <h2 className="mb-3 text-xl font-bold">Darslar ({course.lessons.length})</h2>
            <div className="space-y-2">
              {course.lessons.map((l) => (
                <details key={l.id} className="card group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-xs font-semibold">{l.order}</span>
                    <span className="flex-1 font-medium">{l.title}</span>
                    <span className="text-xs text-slate-400">{l.minutes} daq {l.videoUrl && "· 🎬"}</span>
                    <span className="text-slate-400 group-open:rotate-180">▾</span>
                  </summary>
                  <div className="border-t border-slate-100 p-4">
                    <ActionForm action={saveLesson} submit="Saqlash">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="courseId" value={course.id} />
                      <LessonFields lesson={l} />
                    </ActionForm>
                    <form action={deleteLesson} className="mt-2">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="courseId" value={course.id} />
                      <button className="text-sm font-medium text-rose-600 hover:underline">Darsni o&apos;chirish</button>
                    </form>
                  </div>
                </details>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="mb-3 font-semibold">➕ Yangi dars</h3>
            <ActionForm action={saveLesson} submit="Dars qo'shish" resetOnOk>
              <input type="hidden" name="courseId" value={course.id} />
              <LessonFields lesson={null} />
            </ActionForm>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold">Testlar</h2>
            <div className="space-y-2">
              {course.tests.map((t) => (
                <Link key={t.id} href={`/kabinet/ustoz/testlar/${t.id}`} className="card flex items-center justify-between px-4 py-3 hover:shadow-md">
                  <span className="font-medium">📝 {t.title}</span>
                  <span className="text-sm text-slate-500">{t._count.questions} savol →</span>
                </Link>
              ))}
            </div>
            <div className="card mt-3 p-5">
              <h3 className="mb-3 font-semibold">➕ Yangi test</h3>
              <ActionForm action={createTest} submit="Test yaratish">
                <input type="hidden" name="courseId" value={course.id} />
                <TestFields test={null} />
              </ActionForm>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Kurs ma&apos;lumotlari</h2>
          <div className="card p-6">
            <ActionForm action={updateCourse} submit="Saqlash">
              <input type="hidden" name="id" value={course.id} />
              <CourseFields subjects={subjects} course={course} />
            </ActionForm>
          </div>
          <form action={deleteCourse} className="card border-rose-200 p-5">
            <input type="hidden" name="id" value={course.id} />
            <input type="hidden" name="back" value={user.role === "ADMIN" ? "/admin/kurslar" : "/kabinet/ustoz/kurslar"} />
            <p className="text-sm text-slate-600">Kursni butunlay o&apos;chirish: darslar, yozilishlar va sharhlar ham o&apos;chadi.</p>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" required /> Ha, o&apos;chirishni tasdiqlayman</label>
            <button className="btn mt-3 bg-rose-600 text-white hover:bg-rose-700">Kursni o&apos;chirish</button>
          </form>
        </section>
      </div>
    </div>
  );
}
