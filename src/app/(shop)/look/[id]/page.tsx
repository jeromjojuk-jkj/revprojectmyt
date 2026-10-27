import { redirect } from "next/navigation";
import { IS_FASHION } from "@/lib/constants";
import { notFound } from "next/navigation";
import { getPublicProducts } from "@/lib/server/catalog";
import { LOOKS } from "@/data/catalog";
import { LookBuilder } from "@/components/LookBuilder";

export const dynamic = "force-dynamic";

export default async function LookPage({ params }: { params: Promise<{ id: string }> }) {
  // Fashion-only tool; hidden while Krip sells home gadgets.
  if (!IS_FASHION) redirect("/");
  const { id } = await params;
  const look = LOOKS.find((l) => l.id === id);
  if (!look) notFound();
  const products = await getPublicProducts();
  return (
    <div className="pb-6">
      <LookBuilder look={look} products={products} standalone />
    </div>
  );
}
