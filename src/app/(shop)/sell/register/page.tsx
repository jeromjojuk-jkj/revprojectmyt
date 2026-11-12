import { VENDOR_PLANS, commissionOf, describeCommission, noCommission } from "@/lib/vendorPlans";
import { getSettings } from "@/lib/server/catalog";
import { INDIAN_STATES } from "@/lib/constants";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Register as a seller", robots: { index: false } };

export default async function Register({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const rule = commissionOf(await getSettings());
  const commission = noCommission(rule) ? "" : describeCommission(rule);
  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <h1 className="text-2xl font-bold">Register as a seller</h1>
      <p className="text-sm text-ink-soft">Takes about 5 minutes. You’ll pay the one-time plan fee on the next step.</p>
      <RegisterForm plans={VENDOR_PLANS.map((p) => ({ id: p.id, name: p.name, fee: p.fee }))} states={INDIAN_STATES} commission={commission} initialPlan={["normal", "premium", "advance"].includes(plan ?? "") ? plan! : "premium"} />
    </div>
  );
}
