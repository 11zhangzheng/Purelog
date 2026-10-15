import Link from "next/link";
import { redirect } from "next/navigation";
import { parsePage } from "@/components/Feed";
import DeleteButton from "@/components/DeleteButton";
import Pagination from "@/components/Pagination";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, getSiteStats, listPosts } from "@/lib/posts";
import { deleteArticle, setBanned } from "../actions";

export const metadata = { title: "管理后台", robots: { index: false } };

type SP = Promise<{ tab?: string; page?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.is_admin) redirect("/");
  const sp = await searchParams;
  const tab = sp.tab === "users" ? "users" : "articles";
  const page = parsePage(sp.page);
  const stats = await getSiteStats();

  return (
    <div className="narrow wide">
      <div className="card page-card">
        <h1 className="page-title">管理后台</h1>
        <div className="admin-stats">
          <div><b>{stats.users}</b><span>用户</span></div>
          <div><b>{stats.articles}</b><span>文章</span></div>
          <div><b>{stats.comments}</b><span>评论</span></div>
        </div>
        <nav className="profile-tabs">
          <Link href="/admin" className={tab === "articles" ? "active" : ""}>文章管理</Link>
          <Link href="/admin?tab=users" className={tab === "users" ? "active" : ""}>用户管理</Link>
        </nav>
        {tab === "articles" ? <Articles page={page} /> : <Users page={page} adminId={user.id} />}
      </div>
    </div>
  );
}

async function Articles({ page }: { page: number }) {
  const data = await listPosts({ sort: "latest", page, pageSize: 20 });
  return (
    <>
      <table className="admin-table">
        <thead>
          <tr><th>标题</th><th>作者</th><th>数据</th><th>发布时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          {data.items.map((p) => (
            <tr key={p.id}>
              <td><Link href={`/posts/${p.slug}`}>{p.title}</Link></td>
              <td><Link href={`/user/${p.author.username}`}>{p.author.display_name}</Link></td>
              <td className="muted">◉{p.views} 👍{p.likes} 💬{p.comments}</td>
              <td className="muted">{formatDate(p.date)}</td>
              <td className="admin-ops">
                <Link href={`/write/${p.slug}`} className="link">编辑</Link>
                <form action={deleteArticle}>
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="next" value={`/admin?page=${page}`} />
                  <DeleteButton />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={data.page} pages={data.pages} base="/admin" />
    </>
  );
}

async function Users({ page, adminId }: { page: number; adminId: number }) {
  const size = 20;
  const [users, [{ total }]] = await Promise.all([
    query<{ id: number; username: string; display_name: string; is_admin: boolean; is_banned: boolean; created_at: string; articles: number; comments: number }>(
      `SELECT u.id, u.username, u.display_name, u.is_admin, u.is_banned, u.created_at,
         (SELECT count(*)::int FROM articles WHERE author_id = u.id) AS articles,
         (SELECT count(*)::int FROM comments WHERE user_id = u.id) AS comments
       FROM users u ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
      [size, (page - 1) * size],
    ),
    query<{ total: number }>("SELECT count(*)::int AS total FROM users"),
  ]);
  return (
    <>
      <table className="admin-table">
        <thead>
          <tr><th>用户</th><th>文章 / 评论</th><th>注册时间</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td><Link href={`/user/${u.username}`}>{u.display_name}</Link> <span className="muted">@{u.username}</span></td>
              <td className="muted">{u.articles} / {u.comments}</td>
              <td className="muted">{formatDate(new Date(u.created_at).toISOString())}</td>
              <td>{u.is_admin ? <span className="admin-badge">管理员</span> : u.is_banned ? <span className="banned-badge">已禁言</span> : <span className="muted">正常</span>}</td>
              <td className="admin-ops">
                {!u.is_admin && u.id !== adminId && (
                  <form action={setBanned}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="banned" value={u.is_banned ? "0" : "1"} />
                    <button className={u.is_banned ? "link-btn" : "link-danger"}>{u.is_banned ? "解除禁言" : "禁言"}</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / size))} base="/admin?tab=users" />
    </>
  );
}
