import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Testlar" };

export default async function TestsPage() {
  const tests = await db.test.findMany({ where: { questions: { some: {} }, OR: [{ courseId: null }, { course: { published: true } }] }, include: { subject: true, _count: { select: { questions: true, attempts: true } } }, orderBy: { title: "asc" } });
  return (
    <>
      <PageHeader title="Testlar" subtitle="Bilimingizni sinang. O'tish balini to'plasangiz — tekshiriladigan sertifikat beriladi." />
      <div className="container-x grid gap-5 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((t) => (
          <Link key={t.id} href={`/testlar/${t.slug}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-3xl">{t.subject.icon}</span>
            <h3 className="mt-3 font-semibold group-hover:text-brand-600">{t.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.description}</p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
              <span className="chip">❓ {t._count.questions} savol</span><span className="chip">⏱ {t.durationMin} daq</span>
              <span className="chip">🎯 {t.passPercent}%</span><span className="chip">👥 {t._count.attempts}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
