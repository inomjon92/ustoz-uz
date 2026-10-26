import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CITIES } from "@/lib/format";
import { Empty, PageHeader, TeacherCard } from "@/components/ui";
import { FilterBar } from "@/components/filters";

export const metadata = { title: "Ustozlar" };

type Search = Promise<{ q?: string; fan?: string; shahar?: string; tartib?: string }>;

export default async function TeachersPage({ searchParams }: { searchParams: Search }) {
  const { q, fan, shahar, tartib } = await searchParams;
  const where: Prisma.TeacherProfileWhereInput = {
    ...(fan && { subjects: { some: { slug: fan } } }),
    ...(shahar && { city: shahar }),
    ...(q && {
      OR: [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { headline: { contains: q, mode: "insensitive" } },
        { subjects: { some: { name: { contains: q, mode: "insensitive" } } } },
      ],
    }),
  };
  const orderBy: Prisma.TeacherProfileOrderByWithRelationInput =
    tartib === "arzon" ? { pricePerHour: "asc" } : tartib === "tajriba" ? { experienceYears: "desc" } : { rating: "desc" };

  const [subjects, teachers] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.teacherProfile.findMany({ where, orderBy, include: { user: true, subjects: true } }),
  ]);

  return (
    <>
      <PageHeader title="Ustozlar" subtitle="Tajribali repetitorlarni fan, shahar va narx bo'yicha toping.">
        <FilterBar action="/ustozlar" q={q} selects={[
          { name: "fan", value: fan, placeholder: "Barcha fanlar", options: subjects.map((s) => ({ value: s.slug, label: `${s.icon} ${s.name}` })) },
          { name: "shahar", value: shahar, placeholder: "Barcha shaharlar", options: CITIES.map((c) => ({ value: c, label: c })) },
          { name: "tartib", value: tartib, placeholder: "Reyting bo'yicha", options: [{ value: "arzon", label: "Arzonroq" }, { value: "tajriba", label: "Tajribaliroq" }] },
        ]} />
      </PageHeader>
      <div className="container-x py-8">
        <p className="mb-4 text-sm text-slate-500">{teachers.length} ta ustoz topildi</p>
        {teachers.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{teachers.map((t) => <TeacherCard key={t.id} t={t} />)}</div>
        ) : (
          <Empty title="Hech narsa topilmadi">Filtrlarni o&apos;zgartirib ko&apos;ring.</Empty>
        )}
      </div>
    </>
  );
}
