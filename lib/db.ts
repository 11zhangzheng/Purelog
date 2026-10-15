import "server-only";
import fs from "node:fs";
import path from "node:path";

// 生产环境（Vercel）使用 Postgres：设置 DATABASE_URL / POSTGRES_URL 即可；
// 本地未配置时自动使用嵌入式 PGlite，数据存放在 .data/pglite。
type Row = Record<string, any>;
type Db = { query: <T = Row>(sql: string, params?: unknown[]) => Promise<T[]> };

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
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
CREATE INDEX IF NOT EXISTS articles_author_idx ON articles(author_id);
`;

export const dbAvailable = Boolean(url) || !process.env.VERCEL;


async function connect(): Promise<Db> {
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 5, prepare: false, idle_timeout: 20 });
    await sql.unsafe(SCHEMA);
    return { query: (q, p = []) => sql.unsafe(q, p as any[]) as any };
  }
  if (process.env.VERCEL) throw new Error("未配置数据库：请在 Vercel 中设置 DATABASE_URL");
  // 构建期多进程并发预渲染，嵌入式数据库不支持多进程共享，直接跳过
  if (process.env.NEXT_PHASE === "phase-production-build") throw new Error("构建阶段不连接本地数据库");
  const dir = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(dir);
  await pg.exec(SCHEMA);
  return { query: async (q, p = []) => (await pg.query(q, p)).rows as any };
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
