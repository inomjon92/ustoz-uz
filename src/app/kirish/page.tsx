import Link from "next/link";
import { LoginForm } from "@/components/forms";

export const metadata = { title: "Kirish" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-x max-w-md py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Xush kelibsiz!</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Hisobingizga kiring</p>
        <LoginForm next={next} />
        <p className="mt-6 text-center text-sm text-slate-500">
          Hisobingiz yo&apos;qmi? <Link href="/royxatdan-otish" className="font-semibold text-brand-600">Ro&apos;yxatdan o&apos;ting</Link>
        </p>
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Demo: <b>talaba@ustoz.uz</b> / <b>parol123</b></p>
      </div>
    </div>
  );
}
