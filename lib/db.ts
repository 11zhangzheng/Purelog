import "server-only";
import fs from "node:fs";
import path from "node:path";
import { hashPassword, verifyPassword } from "./password";
import { seedArticles } from "./seed";

// 生产环境（Vercel）使用 Postgres：设置 DATABASE_URL / POSTGRES_URL 即可；
// 本地未配置时自动使用嵌入式 PGlite，数据存放在 .data/pglite。
type Row = Record<string, any>;
type Db = { query: <T = Row>(sql: string, params?: unknown[]) => Promise<T[]> };

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// 每条语句都可重复执行，启动时自动迁移
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  cover TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS favorite_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS words INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS articles_author_idx ON articles(author_id);
CREATE INDEX IF NOT EXISTS articles_created_idx ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category, created_at DESC);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (article_id, tag)
);
CREATE INDEX IF NOT EXISTS article_tags_tag_idx ON article_tags(tag);

CREATE TABLE IF NOT EXISTS article_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);
CREATE INDEX IF NOT EXISTS article_likes_article_idx ON article_likes(article_id);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  reply_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_article_idx ON comments(article_id, created_at);

CREATE TABLE IF NOT EXISTS comment_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE INDEX IF NOT EXISTS follows_followee_idx ON follows(followee_id);
`;

// 管理员账号：由 ADMIN_USERNAME / ADMIN_PASSWORD 配置；
// 本地未配置时默认 admin / 123456；部署在 Vercel 上必须显式设置 ADMIN_PASSWORD 才会创建。
async function ensureAdmin(db: Db): Promise<number | null> {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || (process.env.VERCEL ? "" : "123456");
  if (!password) return null;
  const [row] = await db.query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE lower(username) = lower($1)",
    [username],
  );
  if (!row) {
    const [created] = await db.query<{ id: number }>(
      "INSERT INTO users (username, display_name, password_hash, is_admin, title) VALUES ($1, $2, $3, true, '站长') RETURNING id",
      [username, "管理员", await hashPassword(password)],
    );
    return created.id;
  }
  if (!(await verifyPassword(password, row.password_hash))) {
    // 以环境变量为准：修改 ADMIN_PASSWORD 后重启即可重置管理员密码
    await db.query("UPDATE users SET password_hash = $1, is_admin = true WHERE id = $2", [await hashPassword(password), row.id]);
  } else {
    await db.query("UPDATE users SET is_admin = true WHERE id = $1", [row.id]);
  }
  return row.id;
}

// 空站点时写入几篇示例文章，避免首页空白
async function seed(db: Db, authorId: number | null) {
  if (!authorId || process.env.DISABLE_SEED) return;
  const [{ n }] = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM articles");
  if (n > 0) return;
  const { countWords } = await import("./markdown");
  for (const [i, a] of seedArticles.entries()) {
    const [row] = await db.query<{ id: number }>(
      `INSERT INTO articles (slug, author_id, title, content, summary, category, tags, words, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id`,
      [`seed${i + 1}`, authorId, a.title, a.content, a.summary, a.category, JSON.stringify(a.tags), countWords(a.content), a.date],
    );
    for (const t of a.tags) await db.query("INSERT INTO article_tags (article_id, tag) VALUES ($1, $2)", [row.id, t]);
  }
}

async function init(db: Db) {
  await seed(db, await ensureAdmin(db));
  return db;
}

async function connect(): Promise<Db> {
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 5, prepare: false, idle_timeout: 20, onnotice: () => {} });
    await sql.unsafe(SCHEMA);
    return init({ query: (q, p = []) => sql.unsafe(q, p as any[]) as any });
  }
  if (process.env.VERCEL) throw new Error("未配置数据库：请在 Vercel 中设置 DATABASE_URL");
  // 构建期多进程并发预渲染，嵌入式数据库不支持多进程共享，直接跳过
  if (process.env.NEXT_PHASE === "phase-production-build") throw new Error("构建阶段不连接本地数据库");
  const dir = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(dir);
  await pg.exec(SCHEMA);
  return init({ query: async (q, p = []) => (await pg.query(q, p)).rows as any });
}

function getDb() {
  const g = globalThis as unknown as { __purelogDb?: Promise<Db> };
  if (!g.__purelogDb) {
    g.__purelogDb = connect().catch((e) => {
      g.__purelogDb = undefined;
      throw e;
    });
  }
  return g.__purelogDb;
}

export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await getDb()).query<T>(sql, params);
}
