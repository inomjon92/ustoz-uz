import { db } from "@/lib/db";
import { som } from "@/lib/format";
import { ActionForm } from "@/components/forms";
import { wipeDatabase } from "@/app/admin-actions";

export default async function AdminHome() {
  const [users, teachers, centers, courses, tests, enrollments, certificates, revenue] = await Promise.all([
    db.user.count(), db.teacherProfile.count(), db.center.count(), db.course.count(), db.test.count(),
    db.enrollment.count(), db.certificate.count(), db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
  ]);
  const stats: [string, string | number][] = [
    ["Foydalanuvchilar", users], ["Ustozlar", teachers], ["Markazlar", centers], ["Kurslar", courses],
    ["Testlar", tests], ["Yozilishlar", enrollments], ["Sertifikatlar", certificates], ["Tushum", som(revenue._sum.amount ?? 0)],
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="card p-5"><p className="text-sm text-slate-500">{k}</p><p className="mt-1 text-2xl font-bold text-slate-900">{v}</p></div>
        ))}
      </div>
      <div className="card border-rose-200 p-6">
        <h2 className="text-lg font-bold text-rose-700">⚠️ Bazani noldan boshlash</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Barcha demo va haqiqiy ma&apos;lumotlar o&apos;chiriladi: foydalanuvchilar, ustozlar, markazlar, kurslar, testlar, sharhlar va to&apos;lovlar.
          Faqat fanlar ro&apos;yxati va admin hisoblari qoladi. Bu amalni ortga qaytarib bo&apos;lmaydi.
        </p>
        <ActionForm action={wipeDatabase} submit="Bazani tozalash" className="mt-4 flex max-w-md flex-col gap-3">
          <input name="confirm" className="input" placeholder="Tasdiqlash uchun TOZALASH deb yozing" autoComplete="off" />
        </ActionForm>
      </div>
    </div>
  );
}
