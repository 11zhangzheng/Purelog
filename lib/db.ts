import "server-only";
import fs from "node:fs";
import path from "node:path";
import { hashPassword, verifyPassword } from "./password";

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
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
`;

export const dbAvailable = Boolean(url) || !process.env.VERCEL;


// 管理员账号：由 ADMIN_USERNAME / ADMIN_PASSWORD 配置；
// 本地未配置时默认 admin / 123456；部署在 Vercel 上必须显式设置 ADMIN_PASSWORD 才会创建。
async function ensureAdmin(db: Db) {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || (process.env.VERCEL ? "" : "123456");
  if (!password) return;
  const [row] = await db.query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE lower(username) = lower($1)",
    [username],
  );
  if (!row) {
    await db.query("INSERT INTO users (username, display_name, password_hash, is_admin) VALUES ($1, $2, $3, true)", [
      username,
      "管理员",
      await hashPassword(password),
    ]);
  } else if (!(await verifyPassword(password, row.password_hash))) {
    // 以环境变量为准：修改 ADMIN_PASSWORD 后重启即可重置管理员密码
    await db.query("UPDATE users SET password_hash = $1, is_admin = true WHERE id = $2", [await hashPassword(password), row.id]);
  } else {
    await db.query("UPDATE users SET is_admin = true WHERE id = $1", [row.id]);
  }
}

async function connect(): Promise<Db> {
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 5, prepare: false, idle_timeout: 20 });
    await sql.unsafe(SCHEMA);
    const db: Db = { query: (q, p = []) => sql.unsafe(q, p as any[]) as any };
    await ensureAdmin(db);
    return db;
  }
  if (process.env.VERCEL) throw new Error("未配置数据库：请在 Vercel 中设置 DATABASE_URL");
  // 构建期多进程并发预渲染，嵌入式数据库不支持多进程共享，直接跳过
  if (process.env.NEXT_PHASE === "phase-production-build") throw new Error("构建阶段不连接本地数据库");
  const dir = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(dir);
  await pg.exec(SCHEMA);
  const db: Db = { query: async (q, p = []) => (await pg.query(q, p)).rows as any };
  await ensureAdmin(db);
  return db;
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
