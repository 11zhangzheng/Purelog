import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";

export function GET() {
  const data = getAllPosts().map((p) => {
    const { content } = matter(fs.readFileSync(path.join(process.cwd(), "posts", `${p.slug}.md`), "utf8"));
    const text = content.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`\[\]()!|-]/g, " ").replace(/\s+/g, " ").slice(0, 3000);
    return { slug: p.slug, title: p.title, summary: p.summary, tags: p.tags, category: p.category, date: p.date, text };
  });
  return Response.json(data);
}
