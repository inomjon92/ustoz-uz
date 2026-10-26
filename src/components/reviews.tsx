import { date } from "@/lib/format";
import { Avatar } from "./ui";

type R = { id: string; rating: number; comment: string; createdAt: Date; author: { name: string } };

export function ReviewList({ reviews }: { reviews: R[] }) {
  if (!reviews.length) return <p className="text-sm text-slate-500">Hozircha sharhlar yo&apos;q. Birinchi bo&apos;ling!</p>;
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="card flex gap-3 p-4">
          <Avatar name={r.author.name} />
          <div>
            <p className="text-sm font-semibold text-slate-900">{r.author.name}
              <span className="ml-2 text-accent-500">{"★".repeat(r.rating)}<span className="text-slate-200">{"★".repeat(5 - r.rating)}</span></span>
            </p>
            <p className="text-xs text-slate-400">{date(r.createdAt)}</p>
            <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
