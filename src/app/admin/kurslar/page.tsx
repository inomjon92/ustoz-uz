import Link from "next/link";
import { db } from "@/lib/db";
import { som } from "@/lib/format";
import { SearchBox, SmallButton, Table, Td } from "@/components/admin-ui";
import { toggleCoursePublished } from "@/app/content-actions";

export default async function AdminCourses({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const courses = await db.course.findMany({
    where: q ? { title: { contains: q, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
    include: { subject: true, teacher: { include: { user: true } }, center: true, _count: { select: { lessons: true, enrollments: true } } },
  });
  return (
    <>
      <SearchBox q={q} placeholder="Kurs nomi…" />
      <Table head={["Kurs", "Muallif", "Fan", "Narx", "Darslar", "O'quvchilar", "Holat", ""]}>
        {courses.map((c) => (
          <tr key={c.id}>
            <Td><Link href={`/kurslar/${c.slug}`} className="font-medium hover:text-brand-600">{c.title}</Link></Td>
            <Td>{c.teacher?.user.name ?? c.center?.name ?? "—"}</Td><Td>{c.subject.name}</Td><Td>{som(c.price)}</Td>
            <Td>{c._count.lessons}</Td><Td>{c._count.enrollments}</Td>
            <Td>{c.published ? <span className="chip bg-emerald-50 text-emerald-700">Chop etilgan</span> : <span className="chip bg-amber-50 text-amber-700">Qoralama</span>}</Td>
            <Td className="flex gap-1">
              <Link href={`/kabinet/ustoz/kurslar/${c.id}`}><SmallButton>Tahrirlash</SmallButton></Link>
              <form action={toggleCoursePublished}><input type="hidden" name="id" value={c.id} /><SmallButton>{c.published ? "Yashirish" : "Chop etish"}</SmallButton></form>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
