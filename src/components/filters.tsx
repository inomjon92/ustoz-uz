import Link from "next/link";

type Opt = { value: string; label: string };

export function FilterBar({ action, q, selects }: { action: string; q?: string; selects: { name: string; value?: string; placeholder: string; options: Opt[] }[] }) {
  return (
    <form action={action} className="mt-6 grid gap-2 sm:grid-cols-[1fr_repeat(3,minmax(0,180px))_auto]">
      <input name="q" defaultValue={q} placeholder="Qidirish…" className="input" />
      {selects.map((s) => (
        <select key={s.name} name={s.name} defaultValue={s.value ?? ""} className="input">
          <option value="">{s.placeholder}</option>
          {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      <div className="flex gap-2">
        <button className="btn-primary flex-1">Filtrlash</button>
        <Link href={action} className="btn-ghost">Tozalash</Link>
      </div>
    </form>
  );
}
