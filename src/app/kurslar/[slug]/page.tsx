import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { FORMAT_LABEL, LEVEL_LABEL, som } from "@/lib/format";
import { Stars } from "@/components/ui";
import { ReviewForm, Submit } from "@/components/forms";
import { ReviewList } from "@/components/reviews";
import { enroll } from "@/app/actions";

export default async function CoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tugadi?: string }> }) {
  const { slug } = await params;
  const { tugadi } = await searchParams;
  const c = await db.course.findUnique({
    where: { slug },
    include: {
      subject: true, teacher: { include: { user: true } }, center: true, tests: true,
      lessons: { orderBy: { order: "asc" } },
      reviews: { include: { author: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!c) notFound();
  const user = await getUser();
  const enrollment = user ? await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: c.id } } }) : null;
  const done = user ? new Set((await db.lessonProgress.findMany({ where: { userId: user.id, lesson: { courseId: c.id } } })).map((p) => p.lessonId)) : new Set<string>();
  const totalMin = c.lessons.reduce((a, l) => a + l.minutes, 0);
  const firstOpen = c.lessons.find((l) => !done.has(l.id)) ?? c.lessons[0];

  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 text-white">
        <div className="container-x py-12">
          <p className="text-sm text-brand-200">{c.subject.icon} {c.subject.name} · {LEVEL_LABEL[c.level]}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold text-white sm:text-4xl">{c.title}</h1>
          <p className="mt-3 max-w-2xl text-brand-100">{c.summary}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-brand-100">
            <span className="[&_*]:text-white"><Stars value={c.rating} count={c.reviewCount} /></span>
            <span>👥 {c._count.enrollments} o&apos;quvchi</span><span>📅 {c.durationWeeks} hafta</span>
            <span>🎬 {c.lessons.length} dars · {totalMin} daqiqa</span><span>💻 {FORMAT_LABEL[c.format]}</span>
          </div>
          <p className="mt-3 text-sm">
            Muallif:{" "}
            {c.teacher ? <Link className="font-semibold underline" href={`/ustozlar/${c.teacher.id}`}>{c.teacher.user.name}</Link>
              : c.center && <Link className="font-semibold underline" href={`/markazlar/${c.center.slug}`}>{c.center.name}</Link>}
          </p>
        </div>
      </section>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {tugadi && enrollment?.completedAt && (
            <div className="card border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              🎉 Tabriklaymiz! Kursni tugatdingiz. Sertifikatingiz <Link href="/kabinet" className="font-semibold underline">kabinetda</Link>.
            </div>
          )}
          <section>
            <h2 className="mb-3 text-xl font-bold">Kurs haqida</h2>
            <p className="whitespace-pre-line leading-7 text-slate-600">{c.description}</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-bold">Dastur</h2>
            <ol className="card divide-y divide-slate-100">
              {c.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${done.has(l.id) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {done.has(l.id) ? "✓" : l.order}
                  </span>
                  {enrollment ? <Link href={`/kurslar/${c.slug}/dars/${l.order}`} className="flex-1 font-medium hover:text-brand-600">{l.title}</Link>
                    : <span className="flex-1 font-medium">{l.title}</span>}
                  <span className="text-sm text-slate-400">{l.minutes} daq</span>
                </li>
              ))}
            </ol>
          </section>
          {c.tests.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Yakuniy test</h2>
              {c.tests.map((t) => (
                <Link key={t.id} href={`/testlar/${t.slug}`} className="card flex items-center justify-between p-5 hover:shadow-md">
                  <span className="font-medium">📝 {t.title}</span><span className="text-sm text-brand-600">Boshlash →</span>
                </Link>
              ))}
            </section>
          )}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Sharhlar</h2>
            {enrollment && <ReviewForm target="course" targetId={c.id} path={`/kurslar/${c.slug}`} />}
            <ReviewList reviews={c.reviews} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className={`text-3xl font-bold ${c.price === 0 ? "text-emerald-600" : "text-slate-900"}`}>{som(c.price)}</p>
            {enrollment ? (
              <>
                <div className="mt-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Progress</span><span className="font-semibold">{done.size}/{c.lessons.length}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.lessons.length ? (done.size / c.lessons.length) * 100 : 0}%` }} />
                  </div>
                </div>
                {firstOpen && <Link href={`/kurslar/${c.slug}/dars/${firstOpen.order}`} className="btn-primary mt-5 w-full">{done.size ? "Davom ettirish" : "Boshlash"}</Link>}
              </>
            ) : user ? (
              <form action={enroll} className="mt-4 space-y-3">
                <input type="hidden" name="courseId" value={c.id} />
                {c.price > 0 && (
                  <fieldset>
                    <legend className="label">To&apos;lov usuli</legend>
                    <div className="grid grid-cols-3 gap-2">
                      {["PAYME", "CLICK", "UZUM"].map((p, i) => (
                        <label key={p} className="cursor-pointer">
                          <input type="radio" name="provider" value={p} defaultChecked={i === 0} className="peer sr-only" />
                          <span className="block rounded-xl border border-slate-200 py-2 text-center text-sm font-semibold peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700">
                            {p[0] + p.slice(1).toLowerCase()}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Demo rejim: to&apos;lov avtomatik tasdiqlanadi.</p>
                  </fieldset>
                )}
                <Submit>{c.price > 0 ? "Sotib olish" : "Bepul yozilish"}</Submit>
              </form>
            ) : (
              <Link href={`/kirish?next=/kurslar/${c.slug}`} className="btn-primary mt-4 w-full">Yozilish uchun kiring</Link>
            )}
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li>✅ Umrbod kirish</li><li>✅ Tugatgach sertifikat</li><li>✅ Ustoz bilan aloqa</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
