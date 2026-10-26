import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { Avatar, CourseCard, Stars, Verified } from "@/components/ui";
import { ReviewForm } from "@/components/forms";
import { ReviewList } from "@/components/reviews";

export default async function CenterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await db.center.findUnique({
    where: { slug },
    include: {
      subjects: true,
      reviews: { include: { author: true }, orderBy: { createdAt: "desc" } },
      courses: { where: { published: true }, include: { subject: true, teacher: { include: { user: true } }, center: true } },
    },
  });
  if (!c) notFound();
  const user = await getUser();
  return (
    <div className="container-x space-y-8 py-10">
      <div className="card flex flex-col gap-6 p-6 sm:flex-row">
        <Avatar name={c.name} size="xl" />
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">{c.name} {c.verified && <Verified />}</h1>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
            <Stars value={c.rating} count={c.reviewCount} /><span>📍 {c.city}, {c.address}</span><a href={`tel:${c.phone}`} className="text-brand-600">📞 {c.phone}</a>
          </div>
          <p className="mt-3 leading-7 text-slate-600">{c.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{c.subjects.map((s) => <span key={s.id} className="chip">{s.icon} {s.name}</span>)}</div>
        </div>
      </div>
      <section>
        <h2 className="mb-4 text-xl font-bold">Kurslar</h2>
        {c.courses.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{c.courses.map((x) => <CourseCard key={x.id} c={x} />)}</div>
          : <p className="text-sm text-slate-500">Kurslar tez orada qo&apos;shiladi.</p>}
      </section>
      <section className="max-w-3xl space-y-4">
        <h2 className="text-xl font-bold">Sharhlar</h2>
        {user && <ReviewForm target="center" targetId={c.id} path={`/markazlar/${c.slug}`} />}
        <ReviewList reviews={c.reviews} />
      </section>
    </div>
  );
}
