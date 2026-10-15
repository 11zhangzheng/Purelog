"use server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { query } from "@/lib/db";
import { getArticleRow } from "@/lib/posts";

export type FormState = { error?: string; values?: Record<string, string> } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// 只允许站内相对路径跳转，防止开放重定向
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/write";
}

function dbError(e: unknown): FormState {
  console.error("[purelog]", e);
  return { error: "服务暂不可用，请检查数据库配置后重试" };
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const username = str(fd, "username");
  const displayName = str(fd, "displayName") || username;
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const invite = str(fd, "invite");
  const values = { username, displayName };

  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return { error: "用户名需为 3-20 位字母、数字或下划线", values };
  if (displayName.length > 30) return { error: "昵称最多 30 个字符", values };
  if (password.length < 8 || password.length > 128) return { error: "密码长度需为 8-128 位", values };
  if (password !== confirm) return { error: "两次输入的密码不一致", values };
  const required = process.env.REGISTER_INVITE_CODE;
  if (required && invite !== required) return { error: "邀请码不正确", values };

  try {
    const exists = await query("SELECT 1 FROM users WHERE lower(username) = lower($1)", [username]);
    if (exists.length) return { error: "该用户名已被注册", values };
    const hash = await hashPassword(password);
    const [user] = await query<{ id: number }>(
      "INSERT INTO users (username, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [username, displayName, hash],
    );
    await createSession(user.id);
  } catch (e) {
    return dbError(e);
  }
  redirect(safeNext(str(fd, "next")));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const username = str(fd, "username");
  const password = String(fd.get("password") ?? "");
  const values = { username };
  if (!username || !password) return { error: "请输入用户名和密码", values };
  try {
    const [user] = await query<{ id: number; password_hash: string }>(
      "SELECT id, password_hash FROM users WHERE lower(username) = lower($1)",
      [username],
    );
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return { error: "用户名或密码错误", values };
    }
    await createSession(user.id);
  } catch (e) {
    return dbError(e);
  }
  redirect(safeNext(str(fd, "next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

function parseTags(raw: string) {
  return [...new Set(raw.split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean))].slice(0, 5);
}

function makeSlug() {
  return `${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
}

export async function saveArticle(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/write");

  const id = str(fd, "id");
  const title = str(fd, "title");
  const content = String(fd.get("content") ?? "");
  const category = str(fd, "category");
  const tagsRaw = str(fd, "tags");
  const summary = str(fd, "summary");
  const cover = str(fd, "cover");
  const values = { id, title, content, category, tags: tagsRaw, summary, cover };
  const tags = parseTags(tagsRaw);

  if (!title || title.length > 100) return { error: "标题不能为空，且不超过 100 字", values };
  if (content.trim().length < 10) return { error: "正文至少 10 个字符", values };
  if (content.length > 100_000) return { error: "正文过长（最多 10 万字符）", values };
  if (!category || category.length > 20) return { error: "请填写分类（不超过 20 字）", values };
  if (summary.length > 200) return { error: "摘要不超过 200 字", values };
  if (cover && !/^https?:\/\/\S+$/.test(cover)) return { error: "封面需为 http(s) 图片链接", values };

  let slug: string;
  try {
    if (id) {
      const [row] = await query<{ slug: string; author_id: number }>("SELECT slug, author_id FROM articles WHERE id = $1", [Number(id)]);
      if (!row || !canManage(user, row.author_id)) return { error: "文章不存在或无权编辑", values };
      slug = row.slug;
      await query(
        `UPDATE articles SET title=$1, content=$2, summary=$3, category=$4, tags=$5, cover=$6, updated_at=now() WHERE id=$7`,
        [title, content, summary, category, JSON.stringify(tags), cover || null, Number(id)],
      );
    } else {
      slug = makeSlug();
      await query(
        `INSERT INTO articles (slug, author_id, title, content, summary, category, tags, cover) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [slug, user.id, title, content, summary, category, JSON.stringify(tags), cover || null],
      );
    }
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/", "layout");
  redirect(`/posts/${slug}`);
}

export async function deleteArticle(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const slug = str(fd, "slug");
  const row = await getArticleRow(slug);
  if (row && canManage(user, row.author_id)) {
    await query("DELETE FROM articles WHERE id = $1", [row.id]);
    revalidatePath("/", "layout");
  }
  redirect("/me");
}
