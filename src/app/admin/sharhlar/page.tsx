import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { SmallButton, Table, Td } from "@/components/admin-ui";
import { deleteReview } from "@/app/admin-actions";

export default async function AdminReviews() {
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
    include: { author: true, teacher: { include: { user: true } }, center: true, course: true },
  });
  return (
    <Table head={["Muallif", "Kimga", "Baho", "Sharh", "Sana", ""]}>
      {reviews.map((r) => (
        <tr key={r.id}>
          <Td className="font-medium">{r.author.name}</Td>
          <Td>{r.teacher ? `👩‍🏫 ${r.teacher.user.name}` : r.center ? `🏫 ${r.center.name}` : `📚 ${r.course?.title}`}</Td>
          <Td className="text-accent-500">{"★".repeat(r.rating)}</Td>
          <Td className="max-w-xs text-slate-600">{r.comment}</Td><Td>{date(r.createdAt)}</Td>
          <Td><form action={deleteReview}><input type="hidden" name="id" value={r.id} /><SmallButton danger>O&apos;chirish</SmallButton></form></Td>
        </tr>
      ))}
    </Table>
  );
}
