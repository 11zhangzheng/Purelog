"use server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, createSession, destroySession, getCurrentUser, hashPassword, verifyPassword, type User } from "@/lib/auth";
import { query } from "@/lib/db";
import { countWords, plainText } from "@/lib/markdown";
import { getArticleRow } from "@/lib/posts";
import { isCategory } from "@/lib/site";

export type FormState = { error?: string; ok?: string; values?: Record<string, string> } | undefined;
export type ActionResult = { ok: true } | { ok: false; error: string; login?: boolean };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// 只允许站内相对路径跳转，防止开放重定向
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function dbError(e: unknown): FormState {
  console.error("[purelog]", e);
  return { error: "服务暂不可用，请稍后重试" };
}

const NEED_LOGIN: ActionResult = { ok: false, error: "请先登录", login: true };
const BANNED: ActionResult = { ok: false, error: "账号已被禁言" };

// 简单的频率限制：同一用户在 seconds 秒内 table 中已有记录则拒绝
async function tooFrequent(table: "articles" | "comments", userId: number, seconds: number) {
  const col = table === "articles" ? "author_id" : "user_id";
  const rows = await query(`SELECT 1 FROM ${table} WHERE ${col} = $1 AND created_at > now() - make_interval(secs => $2) LIMIT 1`, [userId, seconds]);
  return rows.length > 0;
}

// ---------- 账号 ----------

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
    const [user] = await query<{ id: number }>(
      "INSERT INTO users (username, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [username, displayName, await hashPassword(password)],
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

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");
  const displayName = str(fd, "displayName");
  const title = str(fd, "title");
  const bio = str(fd, "bio");
  const avatar = str(fd, "avatar");
  const values = { displayName, title, bio, avatar };
  if (!displayName || displayName.length > 30) return { error: "昵称不能为空，且不超过 30 字", values };
  if (title.length > 30) return { error: "职位不超过 30 字", values };
  if (bio.length > 200) return { error: "个人简介不超过 200 字", values };
  if (avatar && !/^https:\/\/\S+$/.test(avatar)) return { error: "头像需为 https 图片链接", values };
  try {
    await query("UPDATE users SET display_name = $1, title = $2, bio = $3, avatar = $4 WHERE id = $5", [
      displayName,
      title,
      bio,
      avatar || null,
      user.id,
    ]);
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: "资料已保存", values };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");
  const oldPw = String(fd.get("oldPassword") ?? "");
  const newPw = String(fd.get("newPassword") ?? "");
  if (newPw.length < 8 || newPw.length > 128) return { error: "新密码长度需为 8-128 位" };
  if (newPw !== String(fd.get("confirm") ?? "")) return { error: "两次输入的新密码不一致" };
  try {
    const [row] = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user.id]);
    if (!(await verifyPassword(oldPw, row.password_hash))) return { error: "原密码错误" };
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(newPw), user.id]);
  } catch (e) {
    return dbError(e);
  }
  return { ok: "密码已修改" };
}

// ---------- 文章 ----------

function parseTags(raw: string) {
  return [...new Set(raw.split(/[,，\s]+/).map((t) => t.trim().slice(0, 20)).filter(Boolean))].slice(0, 5);
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
  const summaryInput = str(fd, "summary");
  const cover = str(fd, "cover");
  const values = { id, title, content, category, tags: tagsRaw, summary: summaryInput, cover };
  const tags = parseTags(tagsRaw);

  if (user.is_banned) return { error: "账号已被禁言，无法发布文章", values };
  if (!title || title.length > 100) return { error: "标题不能为空，且不超过 100 字", values };
  if (content.trim().length < 10) return { error: "正文至少 10 个字符", values };
  if (content.length > 100_000) return { error: "正文过长（最多 10 万字符）", values };
  if (!isCategory(category)) return { error: "请选择文章分类", values };
  if (summaryInput.length > 200) return { error: "摘要不超过 200 字", values };
  if (cover && !/^https?:\/\/\S+$/.test(cover)) return { error: "封面需为 http(s) 图片链接", values };

  const summary = summaryInput || plainText(content).slice(0, 120);
  const words = countWords(content);
  let slug: string;
  try {
    let articleId: number;
    if (id) {
      const [row] = await query<{ slug: string; author_id: number }>("SELECT slug, author_id FROM articles WHERE id = $1", [Number(id)]);
      if (!row || !canManage(user, row.author_id)) return { error: "文章不存在或无权编辑", values };
      slug = row.slug;
      articleId = Number(id);
      await query(
        `UPDATE articles SET title=$1, content=$2, summary=$3, category=$4, tags=$5, cover=$6, words=$7, updated_at=now() WHERE id=$8`,
        [title, content, summary, category, JSON.stringify(tags), cover || null, words, articleId],
      );
      await query("DELETE FROM article_tags WHERE article_id = $1", [articleId]);
    } else {
      if (!user.is_admin && (await tooFrequent("articles", user.id, 60))) return { error: "发布太频繁，请 1 分钟后再试", values };
      slug = makeSlug();
      const [row] = await query<{ id: number }>(
        `INSERT INTO articles (slug, author_id, title, content, summary, category, tags, cover, words)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [slug, user.id, title, content, summary, category, JSON.stringify(tags), cover || null, words],
      );
      articleId = row.id;
    }
    for (const t of tags) {
      await query("INSERT INTO article_tags (article_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING", [articleId, t]);
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
  const row = await getArticleRow(str(fd, "slug"));
  if (row && canManage(user, row.author_id)) {
    await query("DELETE FROM articles WHERE id = $1", [row.id]);
    revalidatePath("/", "layout");
  }
  redirect(safeNext(str(fd, "next") || `/user/${user.username}`));
}

// ---------- 互动：点赞 / 收藏 / 关注 ----------

// 切换一条关联记录，并同步维护计数字段
async function toggle(opts: {
  insert: string;
  remove: string;
  params: unknown[];
  counter?: { table: string; column: string; id: number };
  on: boolean;
}) {
  if (opts.on) {
    const added = await query(`${opts.insert} ON CONFLICT DO NOTHING RETURNING 1`, opts.params);
    if (added.length && opts.counter) {
      await query(`UPDATE ${opts.counter.table} SET ${opts.counter.column} = ${opts.counter.column} + 1 WHERE id = $1`, [opts.counter.id]);
    }
  } else {
    const removed = await query(`${opts.remove} RETURNING 1`, opts.params);
    if (removed.length && opts.counter) {
      await query(
        `UPDATE ${opts.counter.table} SET ${opts.counter.column} = greatest(${opts.counter.column} - 1, 0) WHERE id = $1`,
        [opts.counter.id],
      );
    }
  }
}

export async function toggleLike(articleId: number, on: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  await toggle({
    insert: "INSERT INTO article_likes (user_id, article_id) VALUES ($1, $2)",
    remove: "DELETE FROM article_likes WHERE user_id = $1 AND article_id = $2",
    params: [user.id, articleId],
    counter: { table: "articles", column: "like_count", id: articleId },
    on,
  });
  return { ok: true };
}

export async function toggleFavorite(articleId: number, on: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  await toggle({
    insert: "INSERT INTO favorites (user_id, article_id) VALUES ($1, $2)",
    remove: "DELETE FROM favorites WHERE user_id = $1 AND article_id = $2",
    params: [user.id, articleId],
    counter: { table: "articles", column: "favorite_count", id: articleId },
    on,
  });
  return { ok: true };
}

export async function toggleFollow(userId: number, on: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  if (user.id === userId) return { ok: false, error: "不能关注自己" };
  await toggle({
    insert: "INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2)",
    remove: "DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2",
    params: [user.id, userId],
    on,
  });
  return { ok: true };
}

export async function toggleCommentLike(commentId: number, on: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  await toggle({
    insert: "INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2)",
    remove: "DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2",
    params: [user.id, commentId],
    counter: { table: "comments", column: "like_count", id: commentId },
    on,
  });
  return { ok: true };
}

// ---------- 评论 ----------

export async function addComment(input: { articleId: number; content: string; parentId?: number; replyToUserId?: number }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  if (user.is_banned) return BANNED;
  const content = input.content.trim();
  if (!content) return { ok: false, error: "评论内容不能为空" };
  if (content.length > 1000) return { ok: false, error: "评论最多 1000 字" };
  if (!user.is_admin && (await tooFrequent("comments", user.id, 10))) return { ok: false, error: "评论太频繁，请稍后再试" };

  const [article] = await query<{ slug: string }>("SELECT slug FROM articles WHERE id = $1", [input.articleId]);
  if (!article) return { ok: false, error: "文章不存在" };

  // 楼中楼统一挂在顶层评论下
  let parentId: number | null = null;
  let replyTo: number | null = null;
  if (input.parentId) {
    const [parent] = await query<{ id: number; parent_id: number | null; user_id: number; article_id: number }>(
      "SELECT id, parent_id, user_id, article_id FROM comments WHERE id = $1",
      [input.parentId],
    );
    if (!parent || parent.article_id !== input.articleId) return { ok: false, error: "回复的评论不存在" };
    parentId = parent.parent_id ?? parent.id;
    replyTo = input.replyToUserId ?? parent.user_id;
  }
  await query("INSERT INTO comments (article_id, user_id, parent_id, reply_to_user_id, content) VALUES ($1, $2, $3, $4, $5)", [
    input.articleId,
    user.id,
    parentId,
    replyTo,
    content,
  ]);
  await query("UPDATE articles SET comment_count = comment_count + 1 WHERE id = $1", [input.articleId]);
  revalidatePath(`/posts/${article.slug}`);
  return { ok: true };
}

export async function deleteComment(commentId: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NEED_LOGIN;
  const [c] = await query<{ user_id: number; article_id: number; author_id: number; slug: string }>(
    `SELECT c.user_id, c.article_id, a.author_id, a.slug FROM comments c JOIN articles a ON a.id = c.article_id WHERE c.id = $1`,
    [commentId],
  );
  if (!c) return { ok: false, error: "评论不存在" };
  // 评论者本人、文章作者、管理员可删除
  if (!(canManage(user, c.user_id) || user.id === c.author_id)) return { ok: false, error: "无权删除" };
  const removed = await query<{ id: number }>("DELETE FROM comments WHERE id = $1 OR parent_id = $1 RETURNING id", [commentId]);
  await query("UPDATE articles SET comment_count = greatest(comment_count - $1, 0) WHERE id = $2", [removed.length, c.article_id]);
  revalidatePath(`/posts/${c.slug}`);
  return { ok: true };
}

// ---------- 管理员 ----------

async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect("/");
  return user;
}

export async function setBanned(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(str(fd, "userId"));
  if (id && id !== admin.id) await query("UPDATE users SET is_banned = $1 WHERE id = $2 AND NOT is_admin", [str(fd, "banned") === "1", id]);
  revalidatePath("/admin");
}
