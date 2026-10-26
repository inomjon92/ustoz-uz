import Link from "next/link";
import { db } from "@/lib/db";
import { som } from "@/lib/format";
import { SmallButton, Table, Td } from "@/components/admin-ui";
import { toggleTeacherVerified } from "@/app/admin-actions";

export default async function AdminTeachers() {
  const teachers = await db.teacherProfile.findMany({ orderBy: { createdAt: "desc" }, include: { user: true, subjects: true, _count: { select: { courses: true, bookings: true } } } });
  return (
    <Table head={["Ustoz", "Fanlar", "Shahar", "Narx", "Reyting", "Kurslar", "Holat", ""]}>
      {teachers.map((t) => (
        <tr key={t.id}>
          <Td><Link href={`/ustozlar/${t.id}`} className="font-medium hover:text-brand-600">{t.user.name}</Link><p className="text-xs text-slate-400">{t.user.email}</p></Td>
          <Td>{t.subjects.map((s) => s.name).join(", ")}</Td><Td>{t.city}</Td><Td>{som(t.pricePerHour)}</Td>
          <Td>{t.rating.toFixed(1)} ({t.reviewCount})</Td><Td>{t._count.courses}</Td>
          <Td>{t.verified ? <span className="chip bg-emerald-50 text-emerald-700">Tasdiqlangan</span> : <span className="chip bg-amber-50 text-amber-700">Tekshirilmagan</span>}</Td>
          <Td><form action={toggleTeacherVerified}><input type="hidden" name="id" value={t.id} /><SmallButton>{t.verified ? "Tasdiqni olish" : "Tasdiqlash ✓"}</SmallButton></form></Td>
        </tr>
      ))}
    </Table>
  );
}
