import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { FORMAT_LABEL, som } from "@/lib/format";
import { Avatar, CourseCard, Stars, Verified } from "@/components/ui";
import { BookingForm, ReviewForm } from "@/components/forms";
import { ReviewList } from "@/components/reviews";
import Link from "next/link";

export default async function TeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await db.teacherProfile.findUnique({
    where: { id },
    include: {
      user: true, subjects: true,
      reviews: { include: { author: true }, orderBy: { createdAt: "desc" } },
      courses: { include: { subject: true, teacher: { include: { user: true } }, center: true } },
    },
  });
  if (!t) notFound();
  const user = await getUser();

  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <div className="card flex flex-col gap-6 p-6 sm:flex-row">
          <Avatar name={t.user.name} size="xl" />
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">{t.user.name} {t.verified && <Verified />}</h1>
            <p className="text-slate-600">{t.headline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <Stars value={t.rating} count={t.reviewCount} />
              <span>📍 {t.city}</span><span>🧑‍🏫 {t.experienceYears} yil tajriba</span><span>💻 {FORMAT_LABEL[t.format]}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">{t.subjects.map((s) => <span key={s.id} className="chip">{s.icon} {s.name}</span>)}</div>
          </div>
        </div>
        <section>
          <h2 className="mb-3 text-xl font-bold">Ustoz haqida</h2>
          <p className="whitespace-pre-line leading-7 text-slate-600">{t.bio}</p>
        </section>
        {t.courses.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-bold">Kurslari</h2>
            <div className="grid gap-5 sm:grid-cols-2">{t.courses.map((c) => <CourseCard key={c.id} c={c} />)}</div>
          </section>
        )}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Sharhlar</h2>
          {user && user.teacher?.id !== t.id && <ReviewForm target="teacher" targetId={t.id} path={`/ustozlar/${t.id}`} />}
          <ReviewList reviews={t.reviews} />
        </section>
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <p className="text-3xl font-bold text-slate-900">{som(t.pricePerHour)}</p>
          <p className="text-sm text-slate-500">1 soatlik dars narxi</p>
          <div className="my-5 h-px bg-slate-100" />
          {user ? <BookingForm teacherId={t.id} /> : (
            <Link href={`/kirish?next=/ustozlar/${t.id}`} className="btn-primary w-full">Yozilish uchun kiring</Link>
          )}
        </div>
      </aside>
    </div>
  );
}
