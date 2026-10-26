import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { TestRunner } from "@/components/test-runner";

export default async function TestPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ boshlash?: string }> }) {
  const { slug } = await params;
  const { boshlash } = await searchParams;
  const test = await db.test.findUnique({
    where: { slug },
    include: { subject: true, questions: { orderBy: { order: "asc" }, include: { options: { select: { id: true, text: true } } } } },
  });
  if (!test) notFound();
  const user = await getUser();
  const best = user ? await db.testAttempt.findFirst({ where: { userId: user.id, testId: test.id }, orderBy: { score: "desc" } }) : null;

  return (
    <div className="container-x max-w-3xl py-10">
      <p className="text-sm text-brand-600">{test.subject.icon} {test.subject.name}</p>
      <h1 className="mt-1 text-3xl font-bold">{test.title}</h1>
      <p className="mt-2 text-slate-500">{test.description}</p>
      {boshlash && user ? (
        <div className="mt-8"><TestRunner testId={test.id} durationMin={test.durationMin} questions={test.questions} /></div>
      ) : (
        <div className="card mt-8 p-6">
          <ul className="grid gap-3 text-sm sm:grid-cols-3">
            <li className="rounded-xl bg-slate-50 p-4"><b className="block text-2xl text-slate-900">{test.questions.length}</b>savol</li>
            <li className="rounded-xl bg-slate-50 p-4"><b className="block text-2xl text-slate-900">{test.durationMin}</b>daqiqa</li>
            <li className="rounded-xl bg-slate-50 p-4"><b className="block text-2xl text-slate-900">{test.passPercent}%</b>o&apos;tish bali</li>
          </ul>
          {best && <p className="mt-4 text-sm text-slate-500">Eng yaxshi natijangiz: <b>{best.score}/{best.total}</b> {best.passed && "✅"}</p>}
          <Link href={user ? `/testlar/${slug}?boshlash=1` : `/kirish?next=/testlar/${slug}`} className="btn-primary mt-6 w-full py-3">
            {user ? "Testni boshlash" : "Boshlash uchun kiring"}
          </Link>
        </div>
      )}
    </div>
  );
}
