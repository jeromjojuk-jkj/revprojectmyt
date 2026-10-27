import type { Metadata } from "next";
import { getPublicProducts } from "@/lib/server/catalog";
import { SearchView } from "./SearchView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop" };

export default async function SearchPage() {
  const products = await getPublicProducts();
  return <SearchView products={products} />;
}
