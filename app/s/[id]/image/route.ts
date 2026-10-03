import { shareCardImage } from "@/lib/share-image";
import { getPublicShareCard } from "@/lib/share-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const card = await getPublicShareCard(id);
  if (!card) {
    return new Response("Not found", { status: 404 });
  }
  const image = shareCardImage(card);
  image.headers.set("cache-control", "public, max-age=300");
  return image;
}
