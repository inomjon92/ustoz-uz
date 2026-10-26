import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CourseCard, Empty, PageHeader } from "@/components/ui";
import { FilterBar } from "@/components/filters";

export const metadata = { title: "Kurslar" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ q?: string; fan?: string; daraja?: string; narx?: string }> }) {
  const { q, fan, daraja, narx } = await searchParams;
  const where: Prisma.CourseWhereInput = {
    published: true,
    ...(fan && { subject: { slug: fan } }),
    ...(daraja && { level: daraja as Prisma.EnumLevelFilter["equals"] }),
    ...(narx === "bepul" && { price: 0 }),
    ...(narx === "pullik" && { price: { gt: 0 } }),
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }] }),
  };
  const [subjects, courses] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.course.findMany({ where, orderBy: { reviewCount: "desc" }, include: { subject: true, teacher: { include: { user: true } }, center: true } }),
  ]);
  return (
    <>
      <PageHeader title="Kurslar" subtitle="Onlayn darslar, amaliy topshiriqlar va yakunida sertifikat.">
        <FilterBar action="/kurslar" q={q} selects={[
          { name: "fan", value: fan, placeholder: "Barcha fanlar", options: subjects.map((s) => ({ value: s.slug, label: `${s.icon} ${s.name}` })) },
          { name: "daraja", value: daraja, placeholder: "Har qanday daraja", options: [{ value: "BEGINNER", label: "Boshlang'ich" }, { value: "INTERMEDIATE", label: "O'rta" }, { value: "ADVANCED", label: "Yuqori" }] },
          { name: "narx", value: narx, placeholder: "Har qanday narx", options: [{ value: "bepul", label: "Bepul" }, { value: "pullik", label: "Pullik" }] },
        ]} />
      </PageHeader>
      <div className="container-x py-8">
        {courses.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{courses.map((c) => <CourseCard key={c.id} c={c} />)}</div>
          : <Empty title="Kurs topilmadi" />}
      </div>
    </>
  );
}
