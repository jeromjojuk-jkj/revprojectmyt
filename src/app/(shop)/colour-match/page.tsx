import { redirect } from "next/navigation";
import { IS_FASHION } from "@/lib/constants";
import { getPublicProducts } from "@/lib/server/catalog";
import { ColourMatch } from "./ColourMatch";

export const dynamic = "force-dynamic";
export const metadata = { title: "Colour Match" };

export default async function ColourMatchPage() {
  // Fashion-only tool; hidden while Krip sells home gadgets.
  if (!IS_FASHION) redirect("/");
  return <ColourMatch products={await getPublicProducts()} />;
}
