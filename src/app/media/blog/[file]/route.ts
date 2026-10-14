import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCoverFile } from "@/lib/blog/images";

/**
 * An article's uploaded cover image. File names carry a version (see coverUrl),
 * so each upload can be cached forever by browsers, CDNs and next/image.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const parsed = parseCoverFile((await params).file);
  if (!parsed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const post = await db().blogPost.findUnique({ where: { id: parsed.id }, select: { image: true, imageType: true } });
  if (!post?.image || !post.imageType) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(post.image), {
    headers: {
      "Content-Type": post.imageType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
