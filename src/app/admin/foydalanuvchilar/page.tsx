import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { date } from "@/lib/format";
import { SearchBox, SmallButton, Table, Td } from "@/components/admin-ui";
import { deleteUser, setUserRole } from "@/app/admin-actions";

const ROLES = { STUDENT: "O'quvchi", TEACHER: "Ustoz", CENTER_ADMIN: "Markaz egasi", ADMIN: "Admin" } as const;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const me = await getUser();
  const users = await db.user.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" }, take: 200,
    include: { _count: { select: { enrollments: true } } },
  });
  return (
    <>
      <SearchBox q={q} placeholder="Ism yoki email…" />
      <Table head={["Ism", "Email", "Telefon", "Ro'yxatdan o'tgan", "Kurslar", "Rol", ""]}>
        {users.map((u) => (
          <tr key={u.id}>
            <Td className="font-medium">{u.name}</Td><Td>{u.email}</Td><Td>{u.phone ?? "—"}</Td>
            <Td>{date(u.createdAt)}</Td><Td>{u._count.enrollments}</Td>
            <Td>
              <form action={setUserRole} className="flex gap-1">
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue={u.role} className="rounded-lg border border-slate-200 px-2 py-1 text-xs" disabled={u.id === me?.id}>
                  {Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {u.id !== me?.id && <SmallButton>Saqlash</SmallButton>}
              </form>
            </Td>
            <Td>{u.id !== me?.id && <form action={deleteUser}><input type="hidden" name="id" value={u.id} /><SmallButton danger>O&apos;chirish</SmallButton></form>}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
