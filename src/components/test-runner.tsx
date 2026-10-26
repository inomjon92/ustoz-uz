"use client";

import { useEffect, useRef, useState } from "react";
import { submitTest } from "@/app/actions";
import { Submit } from "./forms";

type Q = { id: string; text: string; options: { id: string; text: string }[] };

export function TestRunner({ testId, durationMin, questions }: { testId: string; durationMin: number; questions: Q[] }) {
  const [left, setLeft] = useState(durationMin * 60);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0) form.current?.requestSubmit();
  }, [left]);

  const count = Object.keys(answered).length;
  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, "0");
  const ss = String(Math.max(0, left % 60)).padStart(2, "0");

  return (
    <form ref={form} action={submitTest} className="space-y-4">
      <input type="hidden" name="testId" value={testId} />
      <div className="card sticky top-20 z-10 flex items-center justify-between p-4">
        <span className="text-sm text-slate-500">Javob berildi: <b className="text-slate-900">{count}/{questions.length}</b></span>
        <span className={`font-mono text-lg font-bold ${left < 60 ? "text-rose-600" : "text-slate-900"}`}>⏱ {mm}:{ss}</span>
      </div>
      {questions.map((q, i) => (
        <fieldset key={q.id} className="card p-5">
          <legend className="sr-only">{i + 1}-savol</legend>
          <p className="font-semibold text-slate-900"><span className="text-brand-600">{i + 1}.</span> {q.text}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {q.options.map((o) => (
              <label key={o.id} className="cursor-pointer">
                <input type="radio" name={`q_${q.id}`} value={o.id} className="peer sr-only" onChange={() => setAnswered((a) => ({ ...a, [q.id]: true }))} />
                <span className="block rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:bg-slate-50 peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-800">{o.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Submit className="btn-primary w-full py-3">Testni yakunlash</Submit>
    </form>
  );
}
