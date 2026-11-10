import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Seller sign in", robots: { index: false } };

export default function VendorLogin() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 ring-1 ring-line">
        <Link href="/" aria-label="krip home"><Logo className="text-[30px]" /></Link>
        <h1 className="mt-4 text-xl font-bold">Seller sign in</h1>
        <LoginForm />
        <p className="mt-4 text-sm text-ink-soft">New seller? <Link href="/sell" className="font-semibold text-leaf underline">See plans and register</Link></p>
      </div>
    </main>
  );
}
