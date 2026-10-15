import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { query } from "./db";
import { countWords, plainText, renderMarkdown, type Heading } from "./markdown";
import { site } from "./site";

export type { Heading };

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
  author: string;
  authorId?: number;
  source: "file" | "db";
};

export type Post = PostMeta & { html: string; headings: Heading[] };

type ArticleRow = {
  id: number;
  slug: string;
  author_id: number;
  display_name: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string;
  cover: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

const iso = (d: string | Date) => new Date(d).toISOString();

function metaFromMarkdown(content: string) {
  const words = countWords(content);
  return { words, readingMinutes: Math.max(1, Math.round(words / 400)), excerpt: plainText(content).slice(0, 120) };
}

// ---------- Markdown 文件中的文章 ----------

function readRaw(slug: string) {
  if (!/^[\w\-一-龥]+$/.test(slug)) return null;
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return matter(fs.readFileSync(file, "utf8"));
}

function fileMeta(slug: string, data: Record<string, any>, content: string): PostMeta {
  const m = metaFromMarkdown(content);
  return {
    slug,
    title: String(data.title ?? slug),
    date: iso(data.date ? new Date(data.date) : new Date(0)),
    updated: data.updated ? iso(data.updated) : undefined,
    category: String(data.category ?? "随笔"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    summary: String(data.summary ?? m.excerpt),
    cover: data.cover,
    draft: Boolean(data.draft),
    readingMinutes: m.readingMinutes,
    words: m.words,
    author: site.author,
    source: "file",
  };
}

let fileCache: PostMeta[] | null = null;

function getFilePosts(): PostMeta[] {
  if (fileCache && process.env.NODE_ENV === "production") return fileCache;
  if (!fs.existsSync(POSTS_DIR)) return [];
  fileCache = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const { data, content } = readRaw(slug)!;
      return fileMeta(slug, data, content);
    })
    .filter((p) => !p.draft || process.env.NODE_ENV !== "production");
  return fileCache;
}

// ---------- 网页端发布、存于数据库的文章 ----------

const ARTICLE_SELECT = `SELECT a.*, u.display_name FROM articles a JOIN users u ON u.id = a.author_id`;

function rowMeta(r: ArticleRow): PostMeta {
  const m = metaFromMarkdown(r.content);
  let tags: string[] = [];
  try {
    tags = JSON.parse(r.tags);
  } catch {}
  return {
    slug: r.slug,
    title: r.title,
    date: iso(r.created_at),
    updated: iso(r.updated_at),
    category: r.category,
    tags,
    summary: r.summary || m.excerpt,
    cover: r.cover || undefined,
    draft: false,
    readingMinutes: m.readingMinutes,
    words: m.words,
    author: r.display_name,
    authorId: r.author_id,
    source: "db",
  };
}

async function getDbPosts(): Promise<PostMeta[]> {
  try {
    const rows = await query<ArticleRow>(`${ARTICLE_SELECT} ORDER BY a.created_at DESC`);
    return rows.map(rowMeta);
  } catch (e) {
    if (process.env.NEXT_PHASE === "phase-production-build") return [];
    console.error("[purelog] 读取数据库文章失败，仅展示 Markdown 文章：", (e as Error).message);
    return [];
  }
}

export async function getArticleRow(slug: string) {
  const rows = await query<ArticleRow>(`${ARTICLE_SELECT} WHERE a.slug = $1`, [slug]);
  return rows[0] ?? null;
}

export async function getPostsByAuthor(authorId: number) {
  const rows = await query<ArticleRow>(`${ARTICLE_SELECT} WHERE a.author_id = $1 ORDER BY a.created_at DESC`, [authorId]);
  return rows.map(rowMeta);
}

// ---------- 对外接口 ----------

export const getAllPosts = cache(async (): Promise<PostMeta[]> => {
  const all = [...getFilePosts(), ...(await getDbPosts())];
  return all.sort((a, b) => b.date.localeCompare(a.date));
});

export async function getPost(slug: string): Promise<Post | null> {
  const raw = readRaw(slug);
  if (raw) {
    const meta = fileMeta(slug, raw.data, raw.content);
    if (meta.draft && process.env.NODE_ENV === "production") return null;
    return { ...meta, ...renderMarkdown(raw.content) };
  }
  try {
    const row = await getArticleRow(slug);
    if (!row) return null;
    return { ...rowMeta(row), ...renderMarkdown(row.content, { sanitize: true }) };
  } catch {
    return null;
  }
}

export async function getPostSource(slug: string) {
  const raw = readRaw(slug);
  return raw ? raw.content : (await getArticleRow(slug))?.content ?? "";
}

function countBy(values: string[]) {
  const map = new Map<string, number>();
  values.forEach((v) => map.set(v, (map.get(v) || 0) + 1));
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export async function getTags() {
  return countBy((await getAllPosts()).flatMap((p) => p.tags));
}

export async function getCategories() {
  return countBy((await getAllPosts()).map((p) => p.category));
}

export async function getAdjacent(slug: string) {
  const all = await getAllPosts();
  const i = all.findIndex((p) => p.slug === slug);
  return { newer: i > 0 ? all[i - 1] : null, older: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}

export async function getRelated(post: PostMeta, n = 5) {
  return (await getAllPosts())
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
