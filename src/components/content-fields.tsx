type Subject = { id: string; name: string; icon: string };
type Course = {
  title: string; summary: string; description: string; subjectId: string; level: string; format: string; price: number; durationWeeks: number;
} | null;

export function CourseFields({ subjects, course }: { subjects: Subject[]; course: Course }) {
  return (
    <>
      <div><label className="label">Kurs nomi</label><input name="title" defaultValue={course?.title} required className="input" placeholder="Masalan: IELTS 7.0 ga tayyorlov" /></div>
      <div><label className="label">Qisqa tavsif (katalogda ko&apos;rinadi)</label><input name="summary" defaultValue={course?.summary} required className="input" /></div>
      <div><label className="label">To&apos;liq tavsif</label><textarea name="description" defaultValue={course?.description} rows={4} required className="input" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Fan</label>
          <select name="subjectId" defaultValue={course?.subjectId ?? ""} required className="input">
            <option value="" disabled>Tanlang</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select></div>
        <div><label className="label">Daraja</label>
          <select name="level" defaultValue={course?.level ?? "BEGINNER"} className="input">
            <option value="BEGINNER">Boshlang&apos;ich</option><option value="INTERMEDIATE">O&apos;rta</option><option value="ADVANCED">Yuqori</option>
          </select></div>
        <div><label className="label">Format</label>
          <select name="format" defaultValue={course?.format ?? "ONLINE"} className="input">
            <option value="ONLINE">Onlayn</option><option value="OFFLINE">Oflayn</option><option value="HYBRID">Onlayn + oflayn</option>
          </select></div>
        <div><label className="label">Davomiyligi (hafta)</label><input name="durationWeeks" type="number" min={1} defaultValue={course?.durationWeeks ?? 4} className="input" /></div>
        <div className="sm:col-span-2"><label className="label">Narx (so&apos;m, 0 = bepul)</label><input name="price" type="number" min={0} step={1000} defaultValue={course?.price ?? 0} className="input" /></div>
      </div>
    </>
  );
}

type Lesson = { title: string; content: string; videoUrl: string | null; minutes: number } | null;

export function LessonFields({ lesson }: { lesson: Lesson }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div><label className="label">Dars nomi</label><input name="title" defaultValue={lesson?.title} required className="input" /></div>
        <div><label className="label">Davomiyligi (daq)</label><input name="minutes" type="number" min={1} defaultValue={lesson?.minutes ?? 15} className="input" /></div>
      </div>
      <div><label className="label">Video havolasi (YouTube, ixtiyoriy)</label><input name="videoUrl" defaultValue={lesson?.videoUrl ?? ""} className="input" placeholder="https://youtube.com/watch?v=..." /></div>
      <div>
        <label className="label">Dars matni</label>
        <textarea name="content" defaultValue={lesson?.content} rows={6} required className="input font-mono text-xs" />
        <p className="mt-1 text-xs text-slate-400">Xatboshilarni bo&apos;sh qator bilan ajrating. Sarlavha uchun qator boshiga ### yozing.</p>
      </div>
    </>
  );
}

type Test = { title: string; description: string; durationMin: number; passPercent: number } | null;

export function TestFields({ test }: { test: Test }) {
  return (
    <>
      <div><label className="label">Test nomi</label><input name="title" defaultValue={test?.title} required className="input" /></div>
      <div><label className="label">Tavsif</label><input name="description" defaultValue={test?.description} required className="input" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Vaqt (daqiqa)</label><input name="durationMin" type="number" min={1} defaultValue={test?.durationMin ?? 10} className="input" /></div>
        <div><label className="label">O&apos;tish bali (%)</label><input name="passPercent" type="number" min={1} max={100} defaultValue={test?.passPercent ?? 70} className="input" /></div>
      </div>
    </>
  );
}
