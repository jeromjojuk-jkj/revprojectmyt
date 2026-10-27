import { redirect } from "next/navigation";
import { IS_FASHION } from "@/lib/constants";
import { getPublicProducts } from "@/lib/server/catalog";
import { VibeFinder } from "./VibeFinder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vibe Finder" };

export default async function VibePage() {
  // Fashion-only tool; hidden while Krip sells home gadgets.
  if (!IS_FASHION) redirect("/");
  return <VibeFinder products={await getPublicProducts()} />;
}
