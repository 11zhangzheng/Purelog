import type { MetadataRoute } from "next";
import { getAllPosts, getCategories, getTags } from "@/lib/posts";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((p) => ({ url: `${site.url}/posts/${p.slug}`, lastModified: p.updated || p.date }));
  const pages = ["", "/archive", "/tags", "/about"].map((p) => ({ url: `${site.url}${p}` }));
  const tags = getTags().map((t) => ({ url: `${site.url}/tags/${encodeURIComponent(t.name)}` }));
  const cats = getCategories().map((c) => ({ url: `${site.url}/category/${encodeURIComponent(c.name)}` }));
  return [...pages, ...posts, ...tags, ...cats];
}
