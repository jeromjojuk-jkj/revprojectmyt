import { ResetForm } from "./ResetForm";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set your password", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl ring-1 ring-line">
        <Logo className="text-[28px]" />
        <h1 className="mt-4 text-xl font-bold">Set your Krip Admin password</h1>
        <p className="mt-1 text-sm text-ink-soft">This link works once and expires 30 minutes after it was created.</p>
        <ResetForm token={token} />
      </div>
    </main>
  );
}
