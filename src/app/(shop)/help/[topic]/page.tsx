import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGES } from "../content";

export function generateStaticParams() {
  return Object.keys(PAGES).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  return { title: PAGES[(await params).topic]?.title ?? "Help" };
}

export default async function PolicyPage({ params }: { params: Promise<{ topic: string }> }) {
  const page = PAGES[(await params).topic];
  if (!page) notFound();
  return (
    <article className="prose-krip mx-auto max-w-2xl px-4 pt-4">
      <Link href="/help" className="text-sm">← Help</Link>
      <h1 className="mt-2 text-xl font-semibold">{page.title}</h1>
      <p className="!text-xs rounded-lg bg-sun-soft px-3 py-2 !text-ink">Prototype policy — to be reviewed with legal counsel before launch.</p>
      {page.body}
    </article>
  );
}
