import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGES } from "../content";
import { getStore } from "@/lib/server/catalog";
import { ContactDetails } from "@/components/ContactDetails";

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  return { title: PAGES[(await params).topic]?.title ?? "Help" };
}

export default async function PolicyPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const page = PAGES[topic];
  if (!page) notFound();
  return (
    <article className="prose-krip mx-auto max-w-2xl px-4 pt-4">
      <Link href="/help" className="text-sm">← Help</Link>
      <h1 className="mt-2 text-xl font-semibold">{page.title}</h1>
      {topic !== "faq" && topic !== "contact" && (
        <p className="!text-xs rounded-lg bg-sun-soft px-3 py-2 !text-ink">Prototype policy — to be reviewed with legal counsel before launch.</p>
      )}
      {page.body}
      {topic === "contact" && <ContactDetails store={await getStore()} />}
    </article>
  );
}
