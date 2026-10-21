import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { PageHeader, btn } from "@/app/admin/_components/ui";
import { CouponForm } from "./CouponForm";

export const metadata = { title: "Coupon" };

export default async function CouponEdit({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  await requirePerm(code === "new" ? "coupons.create" : "coupons.edit");
  const c = code === "new" ? null : (await readDb()).settings.coupons.find((x) => x.code === code);
  if (code !== "new" && !c) notFound();
  const initial: Record<string, string> = c
    ? { code: c.code, description: c.description, kind: c.kind, amountOff: String(c.amountOff), maxDiscount: c.maxDiscount === null ? "" : String(c.maxDiscount), minSubtotal: String(c.minSubtotal),
        startsOn: c.startsOn ?? "", endsOn: c.endsOn ?? "", usageLimit: c.usageLimit === null ? "" : String(c.usageLimit), perCustomerLimit: c.perCustomerLimit === null ? "" : String(c.perCustomerLimit),
        firstOrderOnly: c.firstOrderOnly ? "on" : "", active: c.active ? "on" : "", categories: c.categories.join(",") }
    : { kind: "fixed", minSubtotal: "0", active: "on", perCustomerLimit: "1" };
  return (
    <div className="max-w-3xl">
      <PageHeader title={c ? `Edit ${c.code}` : "New coupon"} actions={<Link href="/admin/coupons" className={btn.secondary}>← Coupons</Link>} />
      <CouponForm initial={initial} original={c?.code ?? ""} />
    </div>
  );
}
