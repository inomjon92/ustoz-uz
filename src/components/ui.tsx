import Link from "next/link";
import { FORMAT_LABEL, LEVEL_LABEL, initials, som } from "@/lib/format";

export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-accent-500">★</span>
      <span className="font-semibold text-slate-800">{value ? value.toFixed(1) : "—"}</span>
      {count !== undefined && <span className="text-slate-400">({count})</span>}
    </span>
  );
}

const AVATAR_COLORS = ["bg-brand-100 text-brand-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-violet-100 text-violet-700"];

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" | "xl" }) {
  const color = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
  const s = { md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" }[size];
  return <span className={`grid shrink-0 place-items-center rounded-2xl font-bold ${s} ${color}`}>{initials(name)}</span>;
}

export function Verified() {
  return <span title="Tasdiqlangan" className="inline-grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-[10px] text-white">✓</span>;
}

type TeacherCardProps = {
  id: string; headline: string; city: string; pricePerHour: number; rating: number; reviewCount: number;
  experienceYears: number; verified: boolean; format: keyof typeof FORMAT_LABEL;
  user: { name: string }; subjects: { name: string }[];
};

export function TeacherCard({ t }: { t: TeacherCardProps }) {
  return (
    <Link href={`/ustozlar/${t.id}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex gap-4">
        <Avatar name={t.user.name} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-brand-600">
            {t.user.name} {t.verified && <Verified />}
          </p>
          <p className="truncate text-sm text-slate-500">{t.headline}</p>
          <Stars value={t.rating} count={t.reviewCount} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {t.subjects.map((s) => <span key={s.name} className="chip">{s.name}</span>)}
      </div>
      <div className="mt-auto flex items-end justify-between pt-4 text-sm">
        <span className="text-slate-500">📍 {t.city} · {t.experienceYears} yil · {FORMAT_LABEL[t.format]}</span>
      </div>
      <p className="mt-2 font-semibold text-slate-900">{som(t.pricePerHour)}<span className="font-normal text-slate-400"> / soat</span></p>
    </Link>
  );
}

type CourseCardProps = {
  slug: string; title: string; summary: string; price: number; level: keyof typeof LEVEL_LABEL;
  format: keyof typeof FORMAT_LABEL; durationWeeks: number; rating: number; reviewCount: number;
  subject: { name: string; icon: string }; teacher?: { user: { name: string } } | null; center?: { name: string } | null;
  _count?: { lessons: number; enrollments: number };
};

export function CourseCard({ c }: { c: CourseCardProps }) {
  return (
    <Link href={`/kurslar/${c.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-28 items-center justify-between bg-gradient-to-br from-brand-600 to-brand-900 px-5 text-white">
        <span className="text-4xl">{c.subject.icon}</span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">{LEVEL_LABEL[c.level]}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{c.subject.name}</p>
        <h3 className="mt-1 font-semibold group-hover:text-brand-600">{c.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.summary}</p>
        <p className="mt-3 text-xs text-slate-500">{c.teacher?.user.name ?? c.center?.name} · {c.durationWeeks} hafta · {FORMAT_LABEL[c.format]}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <Stars value={c.rating} count={c.reviewCount} />
          <span className={`font-semibold ${c.price === 0 ? "text-emerald-600" : "text-slate-900"}`}>{som(c.price)}</span>
        </div>
      </div>
    </Link>
  );
}

type CenterCardProps = {
  slug: string; name: string; description: string; city: string; rating: number; reviewCount: number; verified: boolean;
  subjects: { name: string }[]; _count?: { courses: number };
};

export function CenterCard({ c }: { c: CenterCardProps }) {
  return (
    <Link href={`/markazlar/${c.slug}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <Avatar name={c.name} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold group-hover:text-brand-600">{c.name} {c.verified && <Verified />}</p>
          <p className="text-sm text-slate-500">📍 {c.city}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-500">{c.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {c.subjects.slice(0, 4).map((s) => <span key={s.name} className="chip">{s.name}</span>)}
      </div>
      <div className="mt-auto flex items-center justify-between pt-4 text-sm">
        <Stars value={c.rating} count={c.reviewCount} />
        {c._count && <span className="text-slate-500">{c._count.courses} ta kurs</span>}
      </div>
    </Link>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-14 text-center">
      <p className="text-3xl">🔎</p>
      <p className="mt-3 font-semibold text-slate-900">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="container-x py-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-500">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
