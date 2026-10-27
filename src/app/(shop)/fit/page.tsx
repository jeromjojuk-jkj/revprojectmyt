import { redirect } from "next/navigation";
import { IS_FASHION } from "@/lib/constants";
import { getPublicProducts } from "@/lib/server/catalog";
import { FitBuilder } from "./FitBuilder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Build a Fit" };

export default async function FitPage() {
  // Fashion-only tool; hidden while Krip sells home gadgets.
  if (!IS_FASHION) redirect("/");
  const products = (await getPublicProducts()).filter((p) => p.status === "active" && p.variants.some((v) => v.stock > 0));
  return <FitBuilder products={products} />;
}
