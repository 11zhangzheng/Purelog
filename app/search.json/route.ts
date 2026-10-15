import { getAllPosts, getPostSource } from "@/lib/posts";
import { plainText } from "@/lib/markdown";

export const revalidate = 60;

export async function GET() {
  const posts = await getAllPosts();
  const data = await Promise.all(
    posts.map(async (p) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      tags: p.tags,
      category: p.category,
      date: p.date,
      text: plainText(await getPostSource(p.slug)).slice(0, 3000),
    })),
  );
  return Response.json(data);
}
