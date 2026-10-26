import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export default async function ResultPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const user = await requireUser(`/testlar/${slug}`);
  const a = await db.testAttempt.findUnique({
    where: { id },
    include: { certificate: true, test: { include: { questions: { orderBy: { order: "asc" }, include: { options: true } } } } },
  });
  if (!a || a.userId !== user.id) notFound();
  const answers = a.answers as Record<string, string>;
  const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;

  return (
    <div className="container-x max-w-3xl py-10">
      <div className={`card p-8 text-center ${a.passed ? "border-emerald-200" : "border-rose-200"}`}>
        <p className="text-5xl">{a.passed ? "🎉" : "💪"}</p>
        <h1 className="mt-3 text-2xl font-bold">{a.passed ? "Tabriklaymiz, testdan o'tdingiz!" : "Bu safar yetmadi — yana urinib ko'ring"}</h1>
        <p className="mt-2 text-4xl font-bold text-slate-900">{a.score}/{a.total} <span className="text-lg text-slate-400">({pct}%)</span></p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {a.certificate && <Link href={`/sertifikat/${a.certificate.code}`} className="btn-primary">🏅 Sertifikatni ko&apos;rish</Link>}
          <Link href={`/testlar/${slug}?boshlash=1`} className="btn-ghost">Qayta topshirish</Link>
        </div>
      </div>
      <h2 className="mb-3 mt-10 text-xl font-bold">Javoblar tahlili</h2>
      <ol className="space-y-3">
        {a.test.questions.map((q, i) => {
          const picked = answers[q.id];
          const correct = q.options.find((o) => o.isCorrect);
          const ok = picked === correct?.id;
          return (
            <li key={q.id} className="card p-4">
              <p className="font-medium">{ok ? "✅" : "❌"} {i + 1}. {q.text}</p>
              {!ok && <p className="mt-1 text-sm text-slate-500">To&apos;g&apos;ri javob: <b className="text-emerald-700">{correct?.text}</b>
                {picked && <> · Sizniki: <span className="text-rose-600">{q.options.find((o) => o.id === picked)?.text}</span></>}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
