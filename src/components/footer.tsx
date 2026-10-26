import Link from "next/link";
import { Logo } from "./header";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            O&apos;zbekistondagi ustozlar, o&apos;quv markazlari va o&apos;quvchilarni birlashtiruvchi ta&apos;lim ekotizimi.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-slate-900">Platforma</p>
          <ul className="space-y-1.5 text-slate-500">
            <li><Link href="/ustozlar">Ustozlar</Link></li>
            <li><Link href="/kurslar">Kurslar</Link></li>
            <li><Link href="/testlar">Testlar</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-slate-900">Hamkorlar</p>
          <ul className="space-y-1.5 text-slate-500">
            <li><Link href="/kabinet/ustoz">Ustoz bo&apos;lish</Link></li>
            <li><Link href="/markazlar">O&apos;quv markazlar</Link></li>
            <li><Link href="/sertifikat">Sertifikatni tekshirish</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">© {new Date().getFullYear()} Ustoz.uz</p>
    </footer>
  );
}
