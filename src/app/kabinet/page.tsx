import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { BOOKING_LABEL, PAYMENT_LABEL, date, som } from "@/lib/format";

export const metadata = { title: "Kabinet" };

export default async function Dashboard() {
  const user = await requireUser("/kabinet");
  const [enrollments, attempts, certificates, payments, bookings] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id }, orderBy: { createdAt: "desc" },
      include: { course: { include: { subject: true, _count: { select: { lessons: true } } } } },
    }),
    db.testAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { test: true } }),
    db.certificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" } }),
    db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { enrollment: { include: { course: true } } } }),
    db.booking.findMany({ where: { studentId: user.id }, orderBy: { date: "asc" }, include: { teacher: { include: { user: true } } } }),
  ]);
  const progress = await db.lessonProgress.groupBy({ by: ["lessonId"], where: { userId: user.id } }).then(async (rows) => {
    const lessons = await db.lesson.findMany({ where: { id: { in: rows.map((r) => r.lessonId) } }, select: { courseId: true } });
    return lessons.reduce<Record<string, number>>((m, l) => ({ ...m, [l.courseId]: (m[l.courseId] ?? 0) + 1 }), {});
  });

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Salom, {user.name.split(" ")[0]}! 👋</h1>
          <p className="text-slate-500">Bugun nimani o&apos;rganamiz?</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === "ADMIN" && <Link href="/admin" className="btn-primary">⚙️ Admin panel</Link>}
          {user.role === "CENTER_ADMIN" && <Link href="/kabinet/ustoz/kurslar" className="btn-ghost">🏫 Markaz kurslari</Link>}
          <Link href="/kabinet/ustoz" className="btn-ghost">{user.teacher ? "👩‍🏫 Ustoz paneli" : "Ustoz bo'lish"}</Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[["Kurslarim", enrollments.length], ["Tugatilgan", enrollments.filter((e) => e.completedAt).length], ["Testlar", attempts.length], ["Sertifikatlar", certificates.length]].map(([k, v]) => (
          <div key={k} className="card p-5"><p className="text-sm text-slate-500">{k}</p><p className="mt-1 text-3xl font-bold text-slate-900">{v}</p></div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-xl font-bold">Mening kurslarim</h2>
            {enrollments.length ? (
              <div className="space-y-3">
                {enrollments.map((e) => {
                  const done = progress[e.courseId] ?? 0;
                  const pct = e.course._count.lessons ? Math.round((done / e.course._count.lessons) * 100) : 0;
                  return (
                    <Link key={e.id} href={`/kurslar/${e.course.slug}`} className="card flex items-center gap-4 p-4 hover:shadow-md">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-2xl">{e.course.subject.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{e.course.title}</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                      </div>
                      <span className="text-sm font-semibold text-slate-600">{e.completedAt ? "✅" : `${pct}%`}</span>
                    </Link>
                  );
                })}
              </div>
            ) : <p className="card p-6 text-sm text-slate-500">Hali kursga yozilmagansiz. <Link href="/kurslar" className="font-semibold text-brand-600">Kurslarni ko&apos;rish →</Link></p>}
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">Test natijalari</h2>
            {attempts.length ? (
              <div className="card divide-y divide-slate-100">
                {attempts.map((a) => (
                  <Link key={a.id} href={`/testlar/${a.test.slug}/natija/${a.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                    <span><span className="font-medium">{a.test.title}</span><span className="ml-2 text-xs text-slate-400">{date(a.createdAt)}</span></span>
                    <span className={`chip ${a.passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{a.score}/{a.total}</span>
                  </Link>
                ))}
              </div>
            ) : <p className="card p-6 text-sm text-slate-500">Testlar topshirilmagan. <Link href="/testlar" className="font-semibold text-brand-600">Testlar →</Link></p>}
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">Darsga yozilishlar</h2>
            {bookings.length ? (
              <div className="card divide-y divide-slate-100">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-5 py-3">
                    <span><Link href={`/ustozlar/${b.teacherId}`} className="font-medium hover:text-brand-600">{b.teacher.user.name}</Link>
                      <span className="ml-2 text-xs text-slate-400">{date(b.date)}, {b.date.toTimeString().slice(0, 5)}</span></span>
                    <span className="chip">{BOOKING_LABEL[b.status]}</span>
                  </div>
                ))}
              </div>
            ) : <p className="card p-6 text-sm text-slate-500">Hali ustozga yozilmagansiz.</p>}
          </section>
        </div>

        <aside className="space-y-8">
          <section>
            <h2 className="mb-3 text-xl font-bold">Sertifikatlar</h2>
            {certificates.length ? (
              <div className="space-y-2">
                {certificates.map((c) => (
                  <Link key={c.id} href={`/sertifikat/${c.code}`} className="card flex items-center gap-3 p-4 hover:shadow-md">
                    <span className="text-2xl">🏅</span>
                    <span><span className="block text-sm font-semibold">{c.title}</span><span className="font-mono text-xs text-slate-400">{c.code}</span></span>
                  </Link>
                ))}
              </div>
            ) : <p className="card p-5 text-sm text-slate-500">Kurs tugating yoki testdan o&apos;ting — sertifikat shu yerda paydo bo&apos;ladi.</p>}
          </section>
          <section>
            <h2 className="mb-3 text-xl font-bold">To&apos;lovlar</h2>
            {payments.length ? (
              <div className="card divide-y divide-slate-100 text-sm">
                {payments.map((p) => (
                  <div key={p.id} className="px-4 py-3">
                    <div className="flex justify-between"><span className="font-medium">{p.enrollment?.course.title ?? "To'lov"}</span><span className="font-semibold">{som(p.amount)}</span></div>
                    <p className="text-xs text-slate-400">{p.provider} · {PAYMENT_LABEL[p.status]} · {date(p.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : <p className="card p-5 text-sm text-slate-500">To&apos;lovlar yo&apos;q.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
