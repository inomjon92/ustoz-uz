import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CITIES } from "@/lib/format";
import { CenterCard, Empty, PageHeader } from "@/components/ui";
import { FilterBar } from "@/components/filters";

export const metadata = { title: "O'quv markazlar" };

export default async function CentersPage({ searchParams }: { searchParams: Promise<{ q?: string; fan?: string; shahar?: string }> }) {
  const { q, fan, shahar } = await searchParams;
  const where: Prisma.CenterWhereInput = {
    ...(fan && { subjects: { some: { slug: fan } } }),
    ...(shahar && { city: shahar }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }),
  };
  const [subjects, centers] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.center.findMany({ where, orderBy: { rating: "desc" }, include: { subjects: true, _count: { select: { courses: { where: { published: true } } } } } }),
  ]);
  return (
    <>
      <PageHeader title="O'quv markazlar" subtitle="Shahringizdagi ishonchli o'quv markazlarini solishtiring.">
        <FilterBar action="/markazlar" q={q} selects={[
          { name: "fan", value: fan, placeholder: "Barcha fanlar", options: subjects.map((s) => ({ value: s.slug, label: `${s.icon} ${s.name}` })) },
          { name: "shahar", value: shahar, placeholder: "Barcha shaharlar", options: CITIES.map((c) => ({ value: c, label: c })) },
        ]} />
      </PageHeader>
      <div className="container-x py-8">
        {centers.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{centers.map((c) => <CenterCard key={c.id} c={c} />)}</div>
        ) : <Empty title="Markaz topilmadi" />}
      </div>
    </>
  );
}
