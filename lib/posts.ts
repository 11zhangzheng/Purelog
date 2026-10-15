import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import GithubSlugger from "github-slugger";

const POSTS_DIR = path.join(process.cwd(), "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  summary: string;
  cover?: string;
  draft: boolean;
  readingMinutes: number;
  words: number;
};

export type Heading = { id: string; text: string; level: number };
export type Post = PostMeta & { html: string; headings: Heading[] };

function countWords(md: string) {
  const text = md.replace(/```[\s\S]*?```/g, "").replace(/[#>*_`\-\[\]()!]/g, "");
  const cjk = (text.match(/[一-龥]/g) || []).length;
  const en = (text.replace(/[一-龥]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;
  return cjk + en;
}

function readRaw(slug: string) {
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return matter(fs.readFileSync(file, "utf8"));
}

function toMeta(slug: string, data: Record<string, any>, content: string): PostMeta {
  const words = countWords(content);
  const plain = content.replace(/```[\s\S]*?```/g, "").replace(/[#>*_`]/g, "").replace(/\s+/g, " ").trim();
  const d = data.date ? new Date(data.date) : new Date(0);
  return {
    slug,
    title: String(data.title ?? slug),
    date: d.toISOString(),
    updated: data.updated ? new Date(data.updated).toISOString() : undefined,
    category: String(data.category ?? "随笔"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    summary: String(data.summary ?? plain.slice(0, 120)),
    cover: data.cover,
    draft: Boolean(data.draft),
    readingMinutes: Math.max(1, Math.round(words / 400)),
    words,
  };
}

let cache: PostMeta[] | null = null;

export function getAllPosts(): PostMeta[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(POSTS_DIR)) return [];
  const list = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const { data, content } = readRaw(slug)!;
      return toMeta(slug, data, content);
    })
    .filter((p) => !p.draft || process.env.NODE_ENV !== "production")
    .sort((a, b) => b.date.localeCompare(a.date));
  cache = list;
  return list;
}

export function getPost(slug: string): Post | null {
  const raw = readRaw(slug);
  if (!raw) return null;
  const meta = toMeta(slug, raw.data, raw.content);
  if (meta.draft && process.env.NODE_ENV === "production") return null;

  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  const marked = new Marked(
    markedHighlight({
      emptyLangClass: "hljs",
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    }),
  );
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = text.replace(/<[^>]+>/g, "");
        const id = slugger.slug(plain);
        if (depth >= 2 && depth <= 4) headings.push({ id, text: plain, level: depth });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}">#</a>${text}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const ext = /^https?:\/\//.test(href);
        return `<a href="${href}"${title ? ` title="${title}"` : ""}${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
      },
      image({ href, title, text }) {
        return `<img src="${href}" alt="${text}"${title ? ` title="${title}"` : ""} loading="lazy" />`;
      },
    },
  });
  const html = marked.parse(raw.content, { async: false }) as string;
  return { ...meta, html, headings };
}

export function getTags() {
  const map = new Map<string, number>();
  getAllPosts().forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function getCategories() {
  const map = new Map<string, number>();
  getAllPosts().forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function getAdjacent(slug: string) {
  const all = getAllPosts();
  const i = all.findIndex((p) => p.slug === slug);
  return { newer: i > 0 ? all[i - 1] : null, older: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}

export function getRelated(post: PostMeta, n = 5) {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, score: p.tags.filter((t) => post.tags.includes(t)).length * 2 + (p.category === post.category ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.p);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
