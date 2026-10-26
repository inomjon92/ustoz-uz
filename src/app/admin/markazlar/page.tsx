import Link from "next/link";
import { db } from "@/lib/db";
import { CITIES } from "@/lib/format";
import { ActionForm } from "@/components/forms";
import { SmallButton, Table, Td } from "@/components/admin-ui";
import { createCenter, deleteCenter, toggleCenterVerified } from "@/app/admin-actions";

export default async function AdminCenters() {
  const [centers, subjects] = await Promise.all([
    db.center.findMany({ orderBy: { createdAt: "desc" }, include: { owner: true, _count: { select: { courses: true } } } }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <Table head={["Markaz", "Shahar", "Egasi", "Kurslar", "Holat", ""]}>
        {centers.map((c) => (
          <tr key={c.id}>
            <Td><Link href={`/markazlar/${c.slug}`} className="font-medium hover:text-brand-600">{c.name}</Link></Td>
            <Td>{c.city}</Td><Td>{c.owner?.email ?? "—"}</Td><Td>{c._count.courses}</Td>
            <Td>{c.verified ? "✅" : "—"}</Td>
            <Td className="flex gap-1">
              <form action={toggleCenterVerified}><input type="hidden" name="id" value={c.id} /><SmallButton>{c.verified ? "Tasdiqni olish" : "Tasdiqlash"}</SmallButton></form>
              <form action={deleteCenter}><input type="hidden" name="id" value={c.id} /><SmallButton danger>O&apos;chirish</SmallButton></form>
            </Td>
          </tr>
        ))}
      </Table>
      <div className="card h-fit p-5">
        <h2 className="mb-3 font-semibold">➕ Yangi markaz</h2>
        <ActionForm action={createCenter} submit="Markaz qo'shish" resetOnOk>
          <div><label className="label">Nomi</label><input name="name" required className="input" /></div>
          <div><label className="label">Shahar</label><select name="city" className="input">{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Manzil</label><input name="address" required className="input" /></div>
          <div><label className="label">Telefon</label><input name="phone" required className="input" placeholder="+998 ..." /></div>
          <div><label className="label">Tavsif</label><textarea name="description" rows={3} required className="input" /></div>
          <div>
            <label className="label">Egasining emaili (ixtiyoriy)</label>
            <input name="ownerEmail" type="email" className="input" placeholder="Ro'yxatdan o'tgan foydalanuvchi" />
            <p className="mt-1 text-xs text-slate-400">Egasi o&apos;z kabinetidan markaz nomidan kurs qo&apos;sha oladi.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <label key={s.id} className="cursor-pointer">
                <input type="checkbox" name="subjects" value={s.id} className="peer sr-only" />
                <span className="chip border border-transparent py-1.5 peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700">{s.icon} {s.name}</span>
              </label>
            ))}
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
