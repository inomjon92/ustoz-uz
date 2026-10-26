import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PAYMENT_LABEL, som } from "@/lib/format";

export const metadata = { title: "To'lov holati" };

export default async function PaymentStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/tolov/${id}`);
  const p = await db.payment.findUnique({ where: { id }, include: { course: true } });
  if (!p || p.userId !== user.id) notFound();
  const paid = p.status === "PAID";

  return (
    <div className="container-x max-w-lg py-16">
      {/* Kutilayotgan to'lov holatini har 5 soniyada yangilash */}
      {p.status === "PENDING" && <meta httpEquiv="refresh" content="5" />}
      <div className="card p-8 text-center">
        <p className="text-5xl">{paid ? "✅" : p.status === "PENDING" ? "⏳" : "❌"}</p>
        <h1 className="mt-3 text-2xl font-bold">
          {paid ? "To'lov qabul qilindi!" : p.status === "PENDING" ? "To'lov tasdiqlanishi kutilmoqda" : "To'lov amalga oshmadi"}
        </h1>
        <p className="mt-2 text-slate-500">{p.course?.title} · {som(p.amount)} · {p.provider} · {PAYMENT_LABEL[p.status]}</p>
        {p.status === "PENDING" && <p className="mt-2 text-sm text-slate-400">Sahifa avtomatik yangilanadi. Odatda bu bir necha soniya davom etadi.</p>}
        <div className="mt-6 flex justify-center gap-2">
          {p.course && <Link href={`/kurslar/${p.course.slug}`} className="btn-primary">{paid ? "Kursni boshlash" : "Kursga qaytish"}</Link>}
          <Link href="/kabinet" className="btn-ghost">Kabinet</Link>
        </div>
      </div>
    </div>
  );
}
