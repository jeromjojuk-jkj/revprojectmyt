import { getPublicProducts } from "@/lib/server/catalog";
import { ColourMatch } from "./ColourMatch";

export const dynamic = "force-dynamic";
export const metadata = { title: "Colour Match" };

export default async function ColourMatchPage() {
  return <ColourMatch products={await getPublicProducts()} />;
}
