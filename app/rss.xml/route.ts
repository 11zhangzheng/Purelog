import { listPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const { items } = await listPosts({ sort: "latest", pageSize: 30 }).catch(() => ({ items: [] }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(site.title)}</title>
<link>${site.url}</link>
<description>${esc(site.description)}</description>
<language>zh-CN</language>
${items
  .map(
    (p) => `<item>
<title>${esc(p.title)}</title>
<link>${site.url}/posts/${p.slug}</link>
<guid>${site.url}/posts/${p.slug}</guid>
<author>${esc(p.author.display_name)}</author>
<pubDate>${new Date(p.date).toUTCString()}</pubDate>
<description>${esc(p.summary)}</description>
${p.tags.map((t) => `<category>${esc(t)}</category>`).join("")}
</item>`,
  )
  .join("\n")}
</channel></rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
  });
}
