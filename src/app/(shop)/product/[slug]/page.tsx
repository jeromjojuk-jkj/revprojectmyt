import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProduct, getPublicProducts, getSettings } from "@/lib/server/catalog";
import { LOOKS } from "@/data/catalog";
import { ProductDetail } from "./ProductDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPublicProduct((await params).slug);
  return p ? { title: p.title, description: p.description } : { title: "Product not found" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();
  const [all, settings] = await Promise.all([getPublicProducts(), getSettings()]);

  const looks = LOOKS.filter((l) => l.items.some((i) => i.productId === product.id));
  const lookIds = new Set(looks.flatMap((l) => l.items.map((i) => i.productId)));
  const lookProducts = all.filter((p) => lookIds.has(p.id));

  const score = (p: (typeof all)[number]) =>
    (p.category === product.category ? 3 : 0) +
    (p.subcategory === product.subcategory ? 2 : 0) +
    p.vibes.filter((v) => product.vibes.includes(v)).length;
  const related = all
    .filter((p) => p.id !== product.id && p.status === "active")
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, 10)
    .map((x) => x.p);

  return (
    <ProductDetail
      product={product}
      related={related}
      looks={looks}
      lookProducts={lookProducts}
      deliveryFee={settings.deliveryFee}
      freeDeliveryAbove={settings.freeDeliveryAbove}
    />
  );
}
