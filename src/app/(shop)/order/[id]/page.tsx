import { notFound } from "next/navigation";
import { getOrderForCustomer, refreshCashfreeOrder, toCustomerOrder } from "@/lib/server/orders";
import { OrderView } from "./OrderView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params;
  const { t = "" } = await searchParams;
  let order = await getOrderForCustomer(id, t);
  if (!order) notFound();
  // Back from Cashfree's checkout: ask Cashfree (server-side) whether it was paid.
  if (order.status === "payment_pending" && order.paymentProvider === "cashfree") {
    await refreshCashfreeOrder(order);
    order = (await getOrderForCustomer(id, t)) ?? order;
  }
  return <OrderView order={toCustomerOrder(order)} token={t} />;
}
