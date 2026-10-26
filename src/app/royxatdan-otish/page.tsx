import Link from "next/link";
import { RegisterForm } from "@/components/forms";

export const metadata = { title: "Ro'yxatdan o'tish" };

export default function RegisterPage() {
  return (
    <div className="container-x max-w-md py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Ro&apos;yxatdan o&apos;tish</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Bepul hisob yarating</p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          Hisobingiz bormi? <Link href="/kirish" className="font-semibold text-brand-600">Kirish</Link>
        </p>
      </div>
    </div>
  );
}
