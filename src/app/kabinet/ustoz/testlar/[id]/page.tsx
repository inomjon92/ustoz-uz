import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canEditCourse, requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/forms";
import { TestFields } from "@/components/content-fields";
import { addQuestion, deleteQuestion, deleteTest, updateTest } from "@/app/content-actions";

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/kabinet/ustoz/testlar/${id}`);
  const test = await db.test.findUnique({
    where: { id },
    include: { course: true, questions: { orderBy: { order: "asc" }, include: { options: true } } },
  });
  if (!test) notFound();
  const allowed = user.role === "ADMIN" || (test.courseId && (await canEditCourse(user, test.courseId)));
  if (!allowed) notFound();

  return (
    <div className="container-x max-w-4xl py-10">
      <Link href={test.course ? `/kabinet/ustoz/kurslar/${test.course.id}` : "/admin/testlar"} className="text-sm font-semibold text-brand-600">
        ← {test.course?.title ?? "Testlar"}
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{test.title}</h1>
        <Link href={`/testlar/${test.slug}`} className="btn-ghost">Testni ko&apos;rish</Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Savollar ({test.questions.length})</h2>
          {test.questions.map((q, i) => (
            <div key={q.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{i + 1}. {q.text}</p>
                <form action={deleteQuestion}>
                  <input type="hidden" name="id" value={q.id} /><input type="hidden" name="testId" value={test.id} />
                  <button className="text-sm text-rose-600 hover:underline">O&apos;chirish</button>
                </form>
              </div>
              <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {q.options.map((o) => (
                  <li key={o.id} className={`rounded-lg px-3 py-1.5 ${o.isCorrect ? "bg-emerald-50 font-medium text-emerald-700" : "bg-slate-50 text-slate-600"}`}>
                    {o.isCorrect ? "✓ " : ""}{o.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="card p-5">
            <h3 className="mb-3 font-semibold">➕ Yangi savol</h3>
            <ActionForm action={addQuestion} submit="Savol qo'shish" resetOnOk>
              <input type="hidden" name="testId" value={test.id} />
              <div><label className="label">Savol</label><textarea name="text" rows={2} required className="input" /></div>
              <div className="space-y-2">
                <p className="label">Javob variantlari (to&apos;g&apos;risini belgilang)</p>
                {[0, 1, 2, 3].map((i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" value={i} defaultChecked={i === 0} className="h-4 w-4 accent-emerald-600" />
                    <input name={`option${i}`} className="input" placeholder={`${String.fromCharCode(65 + i)} variant${i > 1 ? " (ixtiyoriy)" : ""}`} />
                  </label>
                ))}
              </div>
            </ActionForm>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">Test sozlamalari</h2>
            <ActionForm action={updateTest} submit="Saqlash">
              <input type="hidden" name="id" value={test.id} />
              <TestFields test={test} />
            </ActionForm>
          </div>
          <form action={deleteTest} className="card border-rose-200 p-5">
            <input type="hidden" name="id" value={test.id} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" required /> Testni o&apos;chirishni tasdiqlayman</label>
            <button className="btn mt-3 bg-rose-600 text-white hover:bg-rose-700">Testni o&apos;chirish</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
