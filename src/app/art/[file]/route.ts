import { ART_KINDS, renderArt } from "@/lib/art";
import type { ArtKind } from "@/lib/types";

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const m = /^([a-z]+)-([0-9a-f]{6})-([12])\.svg$/i.exec(file);
  if (!m || !ART_KINDS.includes(m[1] as ArtKind)) return new Response("Not found", { status: 404 });
  return new Response(renderArt(m[1] as ArtKind, m[2], Number(m[3]) as 1 | 2), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
