import Link from "next/link";
import { db } from "@/lib/db";
import { ActionForm } from "@/components/forms";
import { TestFields } from "@/components/content-fields";
import { SmallButton, Table, Td } from "@/components/admin-ui";
import { createTest } from "@/app/content-actions";

export default async function AdminTests() {
  const [tests, subjects] = await Promise.all([
    db.test.findMany({ orderBy: { title: "asc" }, include: { subject: true, course: true, _count: { select: { questions: true, attempts: true } } } }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <Table head={["Test", "Fan", "Kurs", "Savollar", "Urinishlar", ""]}>
        {tests.map((t) => (
          <tr key={t.id}>
            <Td className="font-medium">{t.title}</Td><Td>{t.subject.name}</Td><Td>{t.course?.title ?? "Mustaqil"}</Td>
            <Td>{t._count.questions}</Td><Td>{t._count.attempts}</Td>
            <Td><Link href={`/kabinet/ustoz/testlar/${t.id}`}><SmallButton>Tahrirlash</SmallButton></Link></Td>
          </tr>
        ))}
      </Table>
      <div className="card h-fit p-5">
        <h2 className="mb-1 font-semibold">➕ Mustaqil test</h2>
        <p className="mb-3 text-xs text-slate-500">Kursga bog&apos;liq bo&apos;lmagan, hamma uchun ochiq test (masalan, daraja aniqlash).</p>
        <ActionForm action={createTest} submit="Test yaratish">
          <div><label className="label">Fan</label>
            <select name="subjectId" required className="input">{subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select></div>
          <TestFields test={null} />
        </ActionForm>
      </div>
    </div>
  );
}
