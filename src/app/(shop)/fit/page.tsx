import { getPublicProducts } from "@/lib/server/catalog";
import { FitBuilder } from "./FitBuilder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Build a Fit" };

export default async function FitPage() {
  const products = (await getPublicProducts()).filter((p) => p.status === "active" && p.variants.some((v) => v.stock > 0));
  return <FitBuilder products={products} />;
}
