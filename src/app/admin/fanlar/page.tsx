import { db } from "@/lib/db";
import { ActionForm } from "@/components/forms";
import { SmallButton, Table, Td } from "@/components/admin-ui";
import { createSubject, deleteSubject } from "@/app/admin-actions";

export default async function AdminSubjects({ searchParams }: { searchParams: Promise<{ xato?: string }> }) {
  const { xato } = await searchParams;
  const subjects = await db.subject.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { courses: true, tests: true, teachers: true } } } });
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        {xato === "band" && <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Bu fanga kurs yoki test biriktirilgan, shuning uchun o&apos;chirib bo&apos;lmaydi.</p>}
        <Table head={["Fan", "Ustozlar", "Kurslar", "Testlar", ""]}>
          {subjects.map((s) => (
            <tr key={s.id}>
              <Td className="font-medium">{s.icon} {s.name}</Td><Td>{s._count.teachers}</Td><Td>{s._count.courses}</Td><Td>{s._count.tests}</Td>
              <Td><form action={deleteSubject}><input type="hidden" name="id" value={s.id} /><SmallButton danger>O&apos;chirish</SmallButton></form></Td>
            </tr>
          ))}
        </Table>
      </div>
      <div className="card h-fit p-5">
        <h2 className="mb-3 font-semibold">➕ Yangi fan</h2>
        <ActionForm action={createSubject} submit="Qo'shish" resetOnOk>
          <div><label className="label">Nomi</label><input name="name" required className="input" placeholder="Biologiya" /></div>
          <div><label className="label">Belgi (emoji)</label><input name="icon" className="input" placeholder="🧬" /></div>
        </ActionForm>
      </div>
    </div>
  );
}
