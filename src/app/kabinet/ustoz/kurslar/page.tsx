import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { som } from "@/lib/format";
import { ActionForm } from "@/components/forms";
import { CourseFields } from "@/components/content-fields";
import { createCourse } from "@/app/content-actions";

export const metadata = { title: "Mening kurslarim" };

export default async function MyCoursesPage() {
  const user = await requireUser("/kabinet/ustoz/kurslar");
  const [subjects, centers, courses] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.center.findMany({ where: { ownerId: user.id } }),
    db.course.findMany({
      where: { OR: [{ teacher: { userId: user.id } }, { center: { ownerId: user.id } }] },
      orderBy: { createdAt: "desc" },
      include: { subject: true, _count: { select: { lessons: true, enrollments: true, tests: true } } },
    }),
  ]);
  const canCreate = !!user.teacher || centers.length > 0;

  return (
    <div className="container-x py-10">
      <Link href="/kabinet/ustoz" className="text-sm font-semibold text-brand-600">← Ustoz paneli</Link>
      <h1 className="mt-2 text-3xl font-bold">Mening kurslarim</h1>
      <p className="text-slate-500">Kurs yarating, darslar va testlar qo&apos;shing, so&apos;ng &quot;Chop etish&quot; tugmasi bilan katalogga chiqaring.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_440px]">
        <section className="space-y-3">
          {courses.length ? courses.map((c) => (
            <Link key={c.id} href={`/kabinet/ustoz/kurslar/${c.id}`} className="card flex items-center gap-4 p-4 hover:shadow-md">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-2xl">{c.subject.icon}</span>
              <div className="flex-1">
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-slate-500">{c._count.lessons} dars · {c._count.tests} test · {c._count.enrollments} o&apos;quvchi · {som(c.price)}</p>
              </div>
              <span className={`chip ${c.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{c.published ? "Chop etilgan" : "Qoralama"}</span>
            </Link>
          )) : <p className="card p-6 text-sm text-slate-500">Hali kurs yo&apos;q. O&apos;ng tomondagi forma orqali birinchi kursingizni yarating.</p>}
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">Yangi kurs</h2>
          {canCreate ? (
            <div className="card p-6">
              <ActionForm action={createCourse} submit="Kursni yaratish">
                {centers.length > 0 && (
                  <div><label className="label">Muallif</label>
                    <select name="owner" className="input">
                      {user.teacher && <option value="teacher">Men (ustoz sifatida)</option>}
                      {centers.map((c) => <option key={c.id} value={`center:${c.id}`}>{c.name}</option>)}
                    </select></div>
                )}
                <CourseFields subjects={subjects} course={null} />
              </ActionForm>
            </div>
          ) : (
            <div className="card p-6 text-sm text-slate-600">
              Kurs yaratish uchun avval <Link href="/kabinet/ustoz" className="font-semibold text-brand-600">ustoz profilingizni</Link> to&apos;ldiring.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
