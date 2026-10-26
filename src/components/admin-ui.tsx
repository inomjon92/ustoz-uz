export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function SmallButton({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return <button className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${danger ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{children}</button>;
}

export function SearchBox({ q, placeholder }: { q?: string; placeholder: string }) {
  return (
    <form className="mb-4 flex gap-2">
      <input name="q" defaultValue={q} placeholder={placeholder} className="input max-w-sm" />
      <button className="btn-ghost">Qidirish</button>
    </form>
  );
}
