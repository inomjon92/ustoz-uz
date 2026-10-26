import Link from "next/link";
import { db } from "@/lib/db";
import { date } from "@/lib/format";

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = await db.certificate.findUnique({ where: { code: decodeURIComponent(code) }, include: { user: true, attempt: true } });
  if (!cert) {
    return (
      <div className="container-x max-w-lg py-16 text-center">
        <p className="text-5xl">⚠️</p>
        <h1 className="mt-3 text-2xl font-bold">Sertifikat topilmadi</h1>
        <p className="mt-2 text-slate-500">&quot;{decodeURIComponent(code)}&quot; kodi bo&apos;yicha sertifikat mavjud emas.</p>
        <Link href="/sertifikat" className="btn-ghost mt-6">Boshqa kodni tekshirish</Link>
      </div>
    );
  }
  return (
    <div className="container-x max-w-3xl py-12">
      <p className="mb-4 text-center text-sm font-semibold text-emerald-700">✅ Bu sertifikat haqiqiy va Ustoz.uz tomonidan berilgan</p>
      <div className="relative overflow-hidden rounded-3xl border-8 border-double border-brand-200 bg-white p-10 text-center shadow-xl">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-brand-50" />
        <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-amber-50" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">Sertifikat</p>
          <p className="mt-6 text-slate-500">Ushbu sertifikat bilan tasdiqlanadiki</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{cert.user.name}</p>
          <p className="mt-4 text-slate-500">quyidagi dasturni muvaffaqiyatli yakunladi:</p>
          <p className="mt-2 text-2xl font-semibold text-brand-700">{cert.title}</p>
          {cert.attempt && <p className="mt-2 text-sm text-slate-500">Natija: {cert.attempt.score}/{cert.attempt.total}</p>}
          <div className="mt-10 flex justify-between text-left text-sm">
            <div><p className="text-slate-400">Berilgan sana</p><p className="font-semibold">{date(cert.issuedAt)}</p></div>
            <div className="text-2xl font-bold text-slate-900">Ustoz<span className="text-brand-600">.uz</span></div>
            <div className="text-right"><p className="text-slate-400">Kod</p><p className="font-mono font-semibold">{cert.code}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
