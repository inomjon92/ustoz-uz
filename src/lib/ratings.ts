import { db } from "./db";

type Target = "teacherId" | "centerId" | "courseId";

/** Sharhlar asosida o'rtacha reyting va sharhlar sonini qayta hisoblaydi */
export async function recomputeRating(key: Target, id: string) {
  const agg = await db.review.aggregate({ where: { [key]: id }, _avg: { rating: true }, _count: true });
  const data = { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count };
  if (key === "teacherId") await db.teacherProfile.update({ where: { id }, data });
  if (key === "centerId") await db.center.update({ where: { id }, data });
  if (key === "courseId") await db.course.update({ where: { id }, data });
}
