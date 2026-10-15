import "server-only";
import { query } from "./db";
import { renderMarkdown, type Heading } from "./markdown";
import { categoryName, site } from "./site";

export type { Heading };

export type Author = {
  id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  title: string;
};

export type PostMeta = {
  id: number;
  slug: string;
  title: string;
  date: string;
  updated: string;
  category: string;
  categoryName: string;
  tags: string[];
  summary: string;
  cover?: string;
  words: number;
  readingMinutes: number;
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  author: Author;
};

export type Post = PostMeta & { content: string; html: string; headings: Heading[] };

type ArticleRow = {
  id: number;
  slug: string;
  author_id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  user_title: string;
  title: string;
  content?: string;
  summary: string;
  category: string;
  tags: string;
  cover: string | null;
  words: number;
  views: number;
  like_count: number;
  comment_count: number;
  favorite_count: number;
  created_at: string | Date;
  updated_at: string | Date;
};

const iso = (d: string | Date) => new Date(d).toISOString();

// 列表查询不取正文，减少传输
const LIST_COLUMNS = `a.id, a.slug, a.author_id, a.title, a.summary, a.category, a.tags, a.cover, a.words,
  a.views, a.like_count, a.comment_count, a.favorite_count, a.created_at, a.updated_at,
  u.username, u.display_name, u.avatar, u.title AS user_title`;
const FROM = `FROM articles a JOIN users u ON u.id = a.author_id`;

function toMeta(r: ArticleRow): PostMeta {
  let tags: string[] = [];
  try {
    tags = JSON.parse(r.tags);
  } catch {}
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    date: iso(r.created_at),
    updated: iso(r.updated_at),
    category: r.category,
    categoryName: categoryName(r.category),
    tags,
    summary: r.summary,
    cover: r.cover || undefined,
    words: r.words,
    readingMinutes: Math.max(1, Math.round(r.words / 400)),
    views: r.views,
    likes: r.like_count,
    comments: r.comment_count,
    favorites: r.favorite_count,
    author: { id: r.author_id, username: r.username, display_name: r.display_name, avatar: r.avatar, title: r.user_title },
  };
}

export type Sort = "recommend" | "latest" | "hot";

const HEAT = "(a.like_count * 3 + a.comment_count * 4 + a.favorite_count * 4 + a.views * 0.1)";
const ORDER: Record<Sort, string> = {
  // 推荐：互动热度随时间衰减（类似 Hacker News 排序）
  recommend: `(${HEAT} + 1) / power(extract(epoch FROM (now() - a.created_at)) / 3600 + 2, 1.5) DESC, a.created_at DESC`,
  latest: "a.created_at DESC",
  hot: `${HEAT} DESC, a.created_at DESC`,
};

export type ListFilter = {
  sort?: Sort;
  category?: string;
  tag?: string;
  authorId?: number;
  likedBy?: number;
  favoritedBy?: number;
  followingOf?: number;
  q?: string;
  page?: number;
  pageSize?: number;
  days?: number;
};

export type Paged<T> = { items: T[]; total: number; page: number; pages: number };

export async function listPosts(f: ListFilter = {}): Promise<Paged<PostMeta>> {
  const where: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (f.category) where.push(`a.category = ${p(f.category)}`);
  if (f.tag) where.push(`EXISTS (SELECT 1 FROM article_tags t WHERE t.article_id = a.id AND t.tag = ${p(f.tag)})`);
  if (f.authorId) where.push(`a.author_id = ${p(f.authorId)}`);
  if (f.likedBy) where.push(`EXISTS (SELECT 1 FROM article_likes l WHERE l.article_id = a.id AND l.user_id = ${p(f.likedBy)})`);
  if (f.favoritedBy) where.push(`EXISTS (SELECT 1 FROM favorites fv WHERE fv.article_id = a.id AND fv.user_id = ${p(f.favoritedBy)})`);
  if (f.followingOf) where.push(`a.author_id IN (SELECT followee_id FROM follows WHERE follower_id = ${p(f.followingOf)})`);
  if (f.days) where.push(`a.created_at > now() - make_interval(days => ${p(f.days)})`);
  const q = f.q?.trim();
  if (q) {
    for (const word of q.split(/\s+/).slice(0, 5)) {
      const like = p(`%${word.replace(/[\\%_]/g, (m) => "\\" + m)}%`);
      where.push(`(a.title ILIKE ${like} OR a.summary ILIKE ${like} OR a.content ILIKE ${like} OR a.tags ILIKE ${like})`);
    }
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countParams = [...params];
  const pageSize = f.pageSize ?? site.pageSize;
  const page = Math.max(1, f.page ?? 1);
  // 搜索时标题命中的排在前面
  const order = q ? `(a.title ILIKE ${p(`%${q}%`)}) DESC, ${ORDER.hot}` : ORDER[f.sort ?? "latest"];
  const [rows, [{ total }]] = await Promise.all([
    query<ArticleRow>(`SELECT ${LIST_COLUMNS} ${FROM} ${w} ORDER BY ${order} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`, params),
    query<{ total: number }>(`SELECT count(*)::int AS total ${FROM} ${w}`, countParams),
  ]);
  return { items: rows.map(toMeta), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPost(slug: string): Promise<Post | null> {
  const rows = await query<ArticleRow>(`SELECT ${LIST_COLUMNS}, a.content ${FROM} WHERE a.slug = $1`, [slug]);
  const r = rows[0];
  if (!r) return null;
  return { ...toMeta(r), content: r.content!, ...renderMarkdown(r.content!, { sanitize: true }) };
}

export type ArticleEditRow = {
  id: number;
  slug: string;
  author_id: number;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string;
  cover: string | null;
};

export async function getArticleRow(slug: string) {
  const rows = await query<ArticleEditRow>(
    "SELECT id, slug, author_id, title, content, summary, category, tags, cover FROM articles WHERE slug = $1",
    [slug],
  );
  return rows[0] ?? null;
}

export async function incrementViews(id: number) {
  await query("UPDATE articles SET views = views + 1 WHERE id = $1", [id]);
}

export async function getHotTags(limit = 20) {
  return query<{ name: string; count: number }>(
    "SELECT tag AS name, count(*)::int AS count FROM article_tags GROUP BY tag ORDER BY count DESC, tag LIMIT $1",
    [limit],
  );
}

export async function getRelated(post: PostMeta, n = 6) {
  const rows = await query<ArticleRow>(
    `SELECT ${LIST_COLUMNS} ${FROM}
     WHERE a.id <> $1 AND (a.category = $2 OR EXISTS (SELECT 1 FROM article_tags t WHERE t.article_id = a.id AND t.tag = ANY($3::text[])))
     ORDER BY ${ORDER.hot} LIMIT $4`,
    [post.id, post.category, post.tags, n],
  );
  return rows.map(toMeta);
}

export async function getMorePostsByAuthor(authorId: number, exceptId: number, n = 5) {
  const rows = await query<ArticleRow>(
    `SELECT ${LIST_COLUMNS} ${FROM} WHERE a.author_id = $1 AND a.id <> $2 ORDER BY a.created_at DESC LIMIT $3`,
    [authorId, exceptId, n],
  );
  return rows.map(toMeta);
}

export async function getInteraction(userId: number | undefined, articleId: number, authorId: number) {
  if (!userId) return { liked: false, favorited: false, following: false };
  const [r] = await query<{ liked: boolean; favorited: boolean; following: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM article_likes WHERE user_id = $1 AND article_id = $2) AS liked,
            EXISTS (SELECT 1 FROM favorites WHERE user_id = $1 AND article_id = $2) AS favorited,
            EXISTS (SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $3) AS following`,
    [userId, articleId, authorId],
  );
  return r;
}

// ---------- 评论 ----------

export type CommentItem = {
  id: number;
  content: string;
  date: string;
  likes: number;
  liked: boolean;
  parentId: number | null;
  user: Author;
  replyTo: { username: string; display_name: string } | null;
  replies: CommentItem[];
};

export async function getComments(articleId: number, viewerId?: number): Promise<CommentItem[]> {
  const rows = await query<any>(
    `SELECT c.id, c.content, c.created_at, c.like_count, c.parent_id,
            u.id AS uid, u.username, u.display_name, u.avatar, u.title,
            ru.username AS r_username, ru.display_name AS r_display_name,
            ${viewerId ? "EXISTS (SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $2)" : "false"} AS liked
     FROM comments c JOIN users u ON u.id = c.user_id LEFT JOIN users ru ON ru.id = c.reply_to_user_id
     WHERE c.article_id = $1 ORDER BY c.created_at ASC, c.id ASC`,
    viewerId ? [articleId, viewerId] : [articleId],
  );
  const all: CommentItem[] = rows.map((r) => ({
    id: r.id,
    content: r.content,
    date: iso(r.created_at),
    likes: r.like_count,
    liked: r.liked,
    parentId: r.parent_id,
    user: { id: r.uid, username: r.username, display_name: r.display_name, avatar: r.avatar, title: r.title },
    replyTo: r.r_username ? { username: r.r_username, display_name: r.r_display_name } : null,
    replies: [],
  }));
  const byId = new Map(all.map((c) => [c.id, c]));
  const roots: CommentItem[] = [];
  for (const c of all) {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    if (parent) parent.replies.push(c);
    else roots.push(c);
  }
  // 顶层评论最新在前，楼中楼按时间正序
  return roots.reverse();
}

// ---------- 用户 ----------

export type Profile = Author & {
  bio: string;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  articles: number;
  likes: number;
  views: number;
  followers: number;
  following: number;
};

export async function getProfile(username: string): Promise<Profile | null> {
  const [r] = await query<any>(
    `SELECT u.id, u.username, u.display_name, u.avatar, u.title, u.bio, u.is_admin, u.is_banned, u.created_at,
       (SELECT count(*)::int FROM articles WHERE author_id = u.id) AS articles,
       (SELECT coalesce(sum(like_count), 0)::int FROM articles WHERE author_id = u.id) AS likes,
       (SELECT coalesce(sum(views), 0)::int FROM articles WHERE author_id = u.id) AS views,
       (SELECT count(*)::int FROM follows WHERE followee_id = u.id) AS followers,
       (SELECT count(*)::int FROM follows WHERE follower_id = u.id) AS following
     FROM users u WHERE lower(u.username) = lower($1)`,
    [username],
  );
  return r ? { ...r, created_at: iso(r.created_at) } : null;
}

export type UserCard = Author & { bio: string; articles: number; likes: number; followed?: boolean };

const USER_CARD = `u.id, u.username, u.display_name, u.avatar, u.title, u.bio,
  (SELECT count(*)::int FROM articles WHERE author_id = u.id) AS articles,
  (SELECT coalesce(sum(like_count), 0)::int FROM articles WHERE author_id = u.id) AS likes`;

export async function getAuthorRank(limit = 5, viewerId?: number): Promise<UserCard[]> {
  return query<UserCard>(
    `SELECT ${USER_CARD}${viewerId ? ", EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND followee_id = u.id) AS followed" : ""}
     FROM users u WHERE EXISTS (SELECT 1 FROM articles WHERE author_id = u.id) AND NOT u.is_banned
     ORDER BY likes DESC, articles DESC, u.id LIMIT $1`,
    viewerId ? [limit, viewerId] : [limit],
  );
}

export async function getFollowList(userId: number, kind: "followers" | "following", viewerId?: number): Promise<UserCard[]> {
  const join = kind === "followers" ? "f.follower_id = u.id WHERE f.followee_id = $1" : "f.followee_id = u.id WHERE f.follower_id = $1";
  return query<UserCard>(
    `SELECT ${USER_CARD}${viewerId ? ", EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND followee_id = u.id) AS followed" : ""}
     FROM follows f JOIN users u ON ${join} ORDER BY f.created_at DESC LIMIT 100`,
    viewerId ? [userId, viewerId] : [userId],
  );
}

export async function getSiteStats() {
  const [r] = await query<{ users: number; articles: number; comments: number }>(
    `SELECT (SELECT count(*)::int FROM users) AS users, (SELECT count(*)::int FROM articles) AS articles,
            (SELECT count(*)::int FROM comments) AS comments`,
  );
  return r;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 掘金风格的相对时间
export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}天前`;
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)}个月前`;
  return formatDate(iso);
}

export function formatCount(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}w` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
