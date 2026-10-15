import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { categories, site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, users] = await Promise.all([
    query<{ slug: string; updated_at: string }>("SELECT slug, updated_at FROM articles ORDER BY created_at DESC LIMIT 5000").catch(() => []),
    query<{ username: string }>("SELECT username FROM users WHERE EXISTS (SELECT 1 FROM articles WHERE author_id = users.id) LIMIT 5000").catch(() => []),
  ]);
  return [
    { url: site.url, changeFrequency: "hourly", priority: 1 },
    { url: `${site.url}/tags` },
    ...categories.map((c) => ({ url: `${site.url}/c/${c.key}` })),
    ...posts.map((p) => ({ url: `${site.url}/posts/${p.slug}`, lastModified: new Date(p.updated_at) })),
    ...users.map((u) => ({ url: `${site.url}/user/${u.username}` })),
  ];
}
