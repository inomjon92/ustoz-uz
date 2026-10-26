import Link from "next/link";
import { getUser } from "@/lib/auth";
import { logout } from "@/app/actions";
import { initials } from "@/lib/format";

const NAV = [
  { href: "/ustozlar", label: "Ustozlar" },
  { href: "/markazlar", label: "O'quv markazlar" },
  { href: "/kurslar", label: "Kurslar" },
  { href: "/testlar", label: "Testlar" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg text-white">U</span>
      <span className="text-lg">Ustoz<span className="text-brand-600">.uz</span></span>
    </Link>
  );
}

export async function Header() {
  const user = await getUser();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="container-x flex h-16 items-center gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/kabinet" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(user.name)}</span>
                <span className="hidden text-sm font-medium sm:block">{user.name.split(" ")[0]}</span>
              </Link>
              <form action={logout}>
                <button className="btn-ghost px-3 py-2">Chiqish</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/kirish" className="btn-ghost px-3 py-2">Kirish</Link>
              <Link href="/royxatdan-otish" className="btn-primary px-3 py-2">Ro&apos;yxatdan o&apos;tish</Link>
            </>
          )}
        </div>
      </div>
      <nav className="container-x flex gap-1 overflow-x-auto pb-2 md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="chip whitespace-nowrap">{n.label}</Link>
        ))}
      </nav>
    </header>
  );
}
