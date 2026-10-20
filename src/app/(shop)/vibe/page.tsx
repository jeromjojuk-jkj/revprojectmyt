import { getPublicProducts } from "@/lib/server/catalog";
import { VibeFinder } from "./VibeFinder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vibe Finder" };

export default async function VibePage() {
  return <VibeFinder products={await getPublicProducts()} />;
}
