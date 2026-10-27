import Link from "next/link";
import { MODULES, ACTIONS, type ModuleId, type ActionId } from "@/lib/rbac";
import { btn } from "../../_components/ui";

export const metadata = { title: "No access" };

export default async function Forbidden({ searchParams }: { searchParams: Promise<{ need?: string }> }) {
  const { need = "" } = await searchParams;
  const [m, a] = need.split(".") as [ModuleId, ActionId];
  const what = MODULES[m] && ACTIONS[a] ? `${ACTIONS[a]} · ${MODULES[m]}` : "this page";
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl" aria-hidden>🔒</p>
      <h1 className="mt-4 text-xl font-bold">You don’t have access to this</h1>
      <p className="mt-2 text-sm text-ink-soft">Your role doesn’t include <b>{what}</b>. Ask a Super Admin if you need it.</p>
      <Link href="/admin" className={`${btn.primary} mt-6`}>Back to dashboard</Link>
    </div>
  );
}
