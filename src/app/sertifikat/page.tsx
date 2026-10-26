import { redirect } from "next/navigation";

export const metadata = { title: "Sertifikatni tekshirish" };

async function check(form: FormData) {
  "use server";
  redirect(`/sertifikat/${String(form.get("code") ?? "").trim().toUpperCase()}`);
}

export default function VerifyPage() {
  return (
    <div className="container-x max-w-lg py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Sertifikatni tekshirish</h1>
        <p className="mt-1 text-sm text-slate-500">Sertifikatdagi kodni kiriting, masalan UZ-1A2B3C4D.</p>
        <form action={check} className="mt-6 flex gap-2">
          <input name="code" required className="input uppercase" placeholder="UZ-XXXXXXXX" />
          <button className="btn-primary">Tekshirish</button>
        </form>
      </div>
    </div>
  );
}
