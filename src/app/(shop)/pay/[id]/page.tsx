import { notFound, redirect } from "next/navigation";
import { getOrderForCustomer } from "@/lib/server/orders";
import { paymentConfig } from "@/lib/server/payments";
import { formatPrice } from "@/lib/format";
import { DemoGateway } from "./DemoGateway";
import { CheckoutSteps } from "@/components/CheckoutSteps";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment", robots: { index: false } };

export default async function PayPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params;
  const { t = "" } = await searchParams;
  const order = await getOrderForCustomer(id, t);
  if (!order) notFound();
  if (order.status !== "payment_pending") redirect(`/order/${id}?t=${encodeURIComponent(t)}`);
  const cfg = paymentConfig();

  return (
    <>
    <CheckoutSteps current={2} />
    <div className="mx-auto max-w-md px-4 pt-6 pb-10">
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <div className="bg-ink px-4 py-3 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-sun">Krip demo payment gateway · test mode</p>
          <p className="text-sm text-white/80">No real money moves. Nothing is charged to any account.</p>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-soft">Order {order.id}</span>
            <span className="text-2xl font-semibold">{formatPrice(order.total)}</span>
          </div>
          {cfg.demo ? (
            <DemoGateway orderId={order.id} token={t} />
          ) : (
            <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
              Online payment isn’t available: {cfg.note}
            </p>
          )}
          <p className="text-xs text-ink-soft">
            Your items are held for 15 minutes while payment is pending. In production, this page is replaced by the payment
            provider’s checkout, and the order is confirmed only when the provider’s signed webhook reaches Krip’s server.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
