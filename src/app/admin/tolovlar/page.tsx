import { db } from "@/lib/db";
import { PAYMENT_LABEL, date, som } from "@/lib/format";
import { Table, Td } from "@/components/admin-ui";

export default async function AdminPayments() {
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true, enrollment: { include: { course: true } } } });
  return (
    <Table head={["Sana", "Foydalanuvchi", "Kurs", "Summa", "Tizim", "Holat"]}>
      {payments.map((p) => (
        <tr key={p.id}>
          <Td>{date(p.createdAt)}</Td><Td>{p.user.name}</Td><Td>{p.enrollment?.course.title ?? "—"}</Td>
          <Td className="font-semibold">{som(p.amount)}</Td><Td>{p.provider}</Td><Td>{PAYMENT_LABEL[p.status]}</Td>
        </tr>
      ))}
    </Table>
  );
}
