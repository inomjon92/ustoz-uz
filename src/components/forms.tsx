"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { addReview, bookTeacher, login, register, saveTeacherProfile, type FormState } from "@/app/actions";

export function Submit({ children, className = "btn-primary w-full" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={className}>
      {pending ? "Yuborilmoqda…" : children}
    </button>
  );
}

function Message({ state }: { state: FormState }) {
  if (state?.error) return <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{state.ok}</p>;
  return null;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div><label className="label">Email</label><input name="email" type="email" required className="input" placeholder="siz@misol.uz" /></div>
      <div><label className="label">Parol</label><input name="password" type="password" required className="input" /></div>
      <Message state={state} />
      <Submit>Kirish</Submit>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(register, undefined);
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {(["STUDENT", "TEACHER"] as const).map((r) => (
          <button type="button" key={r} onClick={() => setRole(r)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${role === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
            {r === "STUDENT" ? "🎓 O'quvchi" : "👩‍🏫 Ustoz"}
          </button>
        ))}
      </div>
      <div><label className="label">Ism familiya</label><input name="name" required className="input" placeholder="Akbar Sidikov" /></div>
      <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
      <div><label className="label">Telefon (ixtiyoriy)</label><input name="phone" className="input" placeholder="+998 90 123 45 67" /></div>
      <div><label className="label">Parol</label><input name="password" type="password" required minLength={6} className="input" /></div>
      <Message state={state} />
      <Submit>Ro&apos;yxatdan o&apos;tish</Submit>
    </form>
  );
}

export function ReviewForm({ target, targetId, path }: { target: "teacher" | "center" | "course"; targetId: string; path: string }) {
  const [state, action] = useActionState(addReview, undefined);
  const [rating, setRating] = useState(0);
  return (
    <form action={action} className="card space-y-3 p-5">
      <p className="font-semibold">Sharh qoldiring</p>
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="path" value={path} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} yulduz`}
            className={n <= rating ? "text-accent-500" : "text-slate-300 hover:text-accent-400"}>★</button>
        ))}
      </div>
      <textarea name="comment" rows={3} className="input" placeholder="Taassurotlaringiz bilan bo'lishing…" />
      <Message state={state} />
      <Submit className="btn-primary">Yuborish</Submit>
    </form>
  );
}

export function BookingForm({ teacherId }: { teacherId: string }) {
  const [state, action] = useActionState(bookTeacher, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="teacherId" value={teacherId} />
      <div><label className="label">Qulay sana va vaqt</label><input type="datetime-local" name="date" required className="input" /></div>
      <div><label className="label">Xabar</label><textarea name="message" rows={3} className="input" placeholder="Masalan: IELTS 7.0 ga tayyorlanmoqchiman" /></div>
      <Message state={state} />
      <Submit>Sinov darsiga yozilish</Submit>
    </form>
  );
}

type Subject = { id: string; name: string; icon: string };
type Profile = { headline: string; bio: string; city: string; experienceYears: number; pricePerHour: number; format: string; subjects: { id: string }[] } | null;

export function TeacherProfileForm({ subjects, cities, profile }: { subjects: Subject[]; cities: string[]; profile: Profile }) {
  const [state, action] = useActionState(saveTeacherProfile, undefined);
  const selected = new Set(profile?.subjects.map((s) => s.id));
  return (
    <form action={action} className="card space-y-4 p-6">
      <div><label className="label">Qisqa tavsif</label><input name="headline" defaultValue={profile?.headline} className="input" placeholder="IELTS va umumiy ingliz tili ustozi" /></div>
      <div><label className="label">O&apos;zingiz haqingizda</label><textarea name="bio" rows={4} defaultValue={profile?.bio} className="input" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Shahar</label>
          <select name="city" defaultValue={profile?.city ?? "Toshkent"} className="input">{cities.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label">Format</label>
          <select name="format" defaultValue={profile?.format ?? "HYBRID"} className="input">
            <option value="ONLINE">Onlayn</option><option value="OFFLINE">Oflayn</option><option value="HYBRID">Onlayn + oflayn</option>
          </select></div>
        <div><label className="label">Tajriba (yil)</label><input name="experienceYears" type="number" min={0} defaultValue={profile?.experienceYears ?? 1} className="input" /></div>
        <div><label className="label">Narx (so&apos;m / soat)</label><input name="pricePerHour" type="number" min={0} step={5000} defaultValue={profile?.pricePerHour ?? 100000} className="input" /></div>
      </div>
      <div>
        <p className="label">Fanlar</p>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <label key={s.id} className="cursor-pointer">
              <input type="checkbox" name="subjects" value={s.id} defaultChecked={selected.has(s.id)} className="peer sr-only" />
              <span className="chip border border-transparent py-1.5 peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700">{s.icon} {s.name}</span>
            </label>
          ))}
        </div>
      </div>
      <Message state={state} />
      <Submit className="btn-primary">Profilni saqlash</Submit>
    </form>
  );
}
