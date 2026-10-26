import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin panel" };

const TABS = [
  ["/admin", "📊 Umumiy"], ["/admin/foydalanuvchilar", "👥 Foydalanuvchilar"], ["/admin/ustozlar", "👩‍🏫 Ustozlar"],
  ["/admin/markazlar", "🏫 Markazlar"], ["/admin/fanlar", "📘 Fanlar"], ["/admin/kurslar", "📚 Kurslar"],
  ["/admin/testlar", "📝 Testlar"], ["/admin/sharhlar", "⭐ Sharhlar"], ["/admin/tolovlar", "💳 To'lovlar"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-x py-8">
      <h1 className="text-2xl font-bold">Admin panel</h1>
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200 pb-2">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">{label}</Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
