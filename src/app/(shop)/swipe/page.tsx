import { getPublicProducts } from "@/lib/server/catalog";
import { StyleSwipe } from "./StyleSwipe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Style Swipe" };

export default async function SwipePage() {
  const products = (await getPublicProducts()).filter((p) => p.status === "active" && p.variants.some((v) => v.stock > 0));
  return <StyleSwipe products={products} />;
}
