import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { BOOKING_LABEL, CITIES, date, som } from "@/lib/format";
import { TeacherProfileForm } from "@/components/forms";
import { updateBooking } from "@/app/actions";
import { Stars } from "@/components/ui";

export const metadata = { title: "Ustoz paneli" };

export default async function TeacherDashboard() {
  const user = await requireUser("/kabinet/ustoz");
  const [subjects, profile] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.teacherProfile.findUnique({
      where: { userId: user.id },
      include: {
        subjects: { select: { id: true } },
        bookings: { orderBy: { date: "asc" }, include: { student: true } },
        courses: { include: { _count: { select: { enrollments: true } } } },
      },
    }),
  ]);
  const students = profile?.courses.reduce((a, c) => a + c._count.enrollments, 0) ?? 0;
  const revenue = profile ? (await db.payment.aggregate({ where: { status: "PAID", course: { teacherId: profile.id } }, _sum: { amount: true } }))._sum.amount ?? 0 : 0;

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ustoz paneli</h1>
          <p className="text-slate-500">{profile ? "Profilingiz, so'rovlar va kurslaringiz" : "Profilingizni to'ldiring — o'quvchilar sizni katalogda ko'radi"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/kabinet/ustoz/kurslar" className="btn-primary">📚 Kurslar, darslar va testlar</Link>
          {profile && <Link href={`/ustozlar/${profile.id}`} className="btn-ghost">Ommaviy profilni ko&apos;rish →</Link>}
        </div>
      </div>

      {profile && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="card p-5"><p className="text-sm text-slate-500">Reyting</p><p className="mt-2"><Stars value={profile.rating} count={profile.reviewCount} /></p></div>
          <div className="card p-5"><p className="text-sm text-slate-500">Yangi so&apos;rovlar</p><p className="mt-1 text-3xl font-bold">{profile.bookings.filter((b) => b.status === "PENDING").length}</p></div>
          <div className="card p-5"><p className="text-sm text-slate-500">Kurs o&apos;quvchilari</p><p className="mt-1 text-3xl font-bold">{students}</p></div>
          <div className="card p-5"><p className="text-sm text-slate-500">Daromad</p><p className="mt-1 text-2xl font-bold">{som(revenue)}</p></div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
        <section>
          <h2 className="mb-3 text-xl font-bold">Dars so&apos;rovlari</h2>
          {profile?.bookings.length ? (
            <div className="space-y-3">
              {profile.bookings.map((b) => (
                <div key={b.id} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{b.student.name} <span className="ml-1 text-sm font-normal text-slate-400">{date(b.date)}, {b.date.toTimeString().slice(0, 5)}</span></p>
                    <span className="chip">{BOOKING_LABEL[b.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{b.message}</p>
                  {b.status === "PENDING" && (
                    <div className="mt-3 flex gap-2">
                      <form action={updateBooking}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="ACCEPTED" /><button className="btn-primary px-3 py-1.5">Qabul qilish</button></form>
                      <form action={updateBooking}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="DECLINED" /><button className="btn-ghost px-3 py-1.5">Rad etish</button></form>
                    </div>
                  )}
                  {b.status === "ACCEPTED" && (
                    <form action={updateBooking} className="mt-3"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="DONE" /><button className="btn-ghost px-3 py-1.5">Dars o&apos;tdi ✓</button></form>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="card p-6 text-sm text-slate-500">Hozircha so&apos;rovlar yo&apos;q.</p>}
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold">Profil</h2>
          <TeacherProfileForm subjects={subjects} cities={CITIES} profile={profile} />
        </section>
      </div>
    </div>
  );
}
