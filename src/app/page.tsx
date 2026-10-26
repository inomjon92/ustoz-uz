import Link from "next/link";
import { db } from "@/lib/db";
import { CenterCard, CourseCard, TeacherCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [subjects, teachers, courses, centers, stats] = await Promise.all([
    db.subject.findMany({ include: { _count: { select: { teachers: true, courses: { where: { published: true } } } } }, orderBy: { name: "asc" } }),
    db.teacherProfile.findMany({ take: 3, orderBy: [{ rating: "desc" }, { reviewCount: "desc" }], include: { user: true, subjects: true } }),
    db.course.findMany({ take: 3, where: { published: true }, orderBy: { reviewCount: "desc" }, include: { subject: true, teacher: { include: { user: true } }, center: true } }),
    db.center.findMany({ take: 3, orderBy: { rating: "desc" }, include: { subjects: true, _count: { select: { courses: { where: { published: true } } } } } }),
    Promise.all([db.teacherProfile.count(), db.center.count(), db.course.count({ where: { published: true } }), db.user.count({ where: { role: "STUDENT" } })]),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="container-x relative py-20 sm:py-28">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">🇺🇿 O&apos;zbekistonning ta&apos;lim ekotizimi</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Eng yaxshi ustozni toping, bilimingizni sertifikat bilan tasdiqlang
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-100">
            Repetitorlar, o&apos;quv markazlari, onlayn kurslar va testlar — barchasi bitta platformada.
          </p>
          <form action="/ustozlar" className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row">
            <input name="q" placeholder="Fan yoki ustoz ismi: IELTS, matematika…" className="flex-1 rounded-xl px-4 py-3 text-slate-800 outline-none" />
            <button className="btn-primary px-6 py-3">Qidirish</button>
          </form>
          <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[["Ustozlar", stats[0]], ["Markazlar", stats[1]], ["Kurslar", stats[2]], ["O'quvchilar", stats[3]]].map(([k, v]) => (
              <div key={k}><dt className="text-sm text-brand-200">{k}</dt><dd className="text-3xl font-bold">{v}+</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-x py-14">
        <h2 className="text-2xl font-bold">Fanlar bo&apos;yicha</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {subjects.map((s) => (
            <Link key={s.id} href={`/ustozlar?fan=${s.slug}`} className="card flex items-center gap-3 p-4 transition hover:border-brand-200 hover:shadow-md">
              <span className="text-2xl">{s.icon}</span>
              <span>
                <span className="block font-semibold text-slate-900">{s.name}</span>
                <span className="text-xs text-slate-500">{s._count.teachers} ustoz · {s._count.courses} kurs</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Section title="Top ustozlar" href="/ustozlar">
        {teachers.map((t) => <TeacherCard key={t.id} t={t} />)}
      </Section>

      <section className="container-x py-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["🔍", "Toping", "Fan, shahar, narx va reyting bo'yicha filtrlab o'zingizga mos ustoz yoki markazni tanlang."],
            ["📚", "O'rganing", "Onlayn kurslarda darsma-dars o'qing yoki ustoz bilan jonli darsga yoziling."],
            ["🏅", "Tasdiqlang", "Testlardan o'ting va kod orqali tekshiriladigan sertifikat oling."],
          ].map(([i, t, d]) => (
            <div key={t} className="card p-6">
              <span className="text-3xl">{i}</span>
              <p className="mt-3 text-lg font-semibold text-slate-900">{t}</p>
              <p className="mt-1 text-sm text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <Section title="Mashhur kurslar" href="/kurslar">
        {courses.map((c) => <CourseCard key={c.id} c={c} />)}
      </Section>

      <Section title="O'quv markazlar" href="/markazlar">
        {centers.map((c) => <CenterCard key={c.id} c={c} />)}
      </Section>

      <section className="container-x py-14">
        <div className="card flex flex-col items-start justify-between gap-6 bg-gradient-to-r from-amber-50 to-white p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Siz ustozmisiz?</h2>
            <p className="mt-1 text-slate-600">Profil yarating, o&apos;quvchilar sizni topsin. Ro&apos;yxatdan o&apos;tish bepul.</p>
          </div>
          <Link href="/royxatdan-otish" className="btn-primary px-6 py-3">Ustoz sifatida qo&apos;shilish</Link>
        </div>
      </section>
    </>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="container-x py-10">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-brand-600 hover:underline">Barchasi →</Link>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
