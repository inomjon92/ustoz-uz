import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { completeLesson } from "@/app/actions";
import { Submit } from "@/components/forms";
import { toEmbedUrl } from "@/lib/embed";

export default async function LessonPage({ params }: { params: Promise<{ slug: string; order: string }> }) {
  const { slug, order } = await params;
  const course = await db.course.findUnique({ where: { slug }, include: { lessons: { orderBy: { order: "asc" } } } });
  if (!course) notFound();
  const user = await requireUser(`/kurslar/${slug}`);
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
  if (!enrollment) redirect(`/kurslar/${slug}`);
  const lesson = course.lessons.find((l) => l.order === Number(order));
  if (!lesson) notFound();
  const done = new Set((await db.lessonProgress.findMany({ where: { userId: user.id, lesson: { courseId: course.id } } })).map((p) => p.lessonId));
  const idx = course.lessons.indexOf(lesson);
  const prev = course.lessons[idx - 1];

  return (
    <div className="container-x grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
      <aside className="card h-fit p-3 lg:sticky lg:top-24">
        <Link href={`/kurslar/${slug}`} className="block px-3 py-2 text-sm font-semibold text-brand-600">← {course.title}</Link>
        <ol className="mt-1 space-y-0.5">
          {course.lessons.map((l) => (
            <li key={l.id}>
              <Link href={`/kurslar/${slug}/dars/${l.order}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${l.id === lesson.id ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-600 hover:bg-slate-50"}`}>
                <span className={done.has(l.id) ? "text-emerald-600" : "text-slate-300"}>{done.has(l.id) ? "●" : "○"}</span>{l.title}
              </Link>
            </li>
          ))}
        </ol>
      </aside>
      <article className="card p-6 sm:p-8">
        <p className="text-sm text-slate-400">{lesson.order}-dars · {lesson.minutes} daqiqa</p>
        <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>
        {lesson.videoUrl && (
          <div className="mt-6 aspect-video overflow-hidden rounded-xl bg-slate-900">
            <iframe src={toEmbedUrl(lesson.videoUrl)!} className="h-full w-full" allowFullScreen title={lesson.title} />
          </div>
        )}
        <div className="prose-lesson mt-6 text-slate-700">
          {lesson.content.split("\n\n").map((p, i) => p.startsWith("### ") ? <h3 key={i}>{p.slice(4)}</h3> : <p key={i}>{p}</p>)}
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          {prev ? <Link href={`/kurslar/${slug}/dars/${prev.order}`} className="btn-ghost">← Oldingi</Link> : <span />}
          <form action={completeLesson}>
            <input type="hidden" name="lessonId" value={lesson.id} />
            <Submit className="btn-primary">{done.has(lesson.id) ? "Keyingi dars →" : "Tugatdim, keyingisi →"}</Submit>
          </form>
        </div>
      </article>
    </div>
  );
}
