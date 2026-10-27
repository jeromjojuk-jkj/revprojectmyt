import { notFound } from "next/navigation";
import { getOrderForCustomer, toCustomerOrder } from "@/lib/server/orders";
import { OrderView } from "./OrderView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params;
  const { t = "" } = await searchParams;
  const order = await getOrderForCustomer(id, t);
  if (!order) notFound();
  return <OrderView order={toCustomerOrder(order)} token={t} />;
}
