import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, getPostsByAuthor } from "@/lib/posts";
import { deleteArticle } from "../actions";
import DeleteButton from "./DeleteButton";

export const metadata = { title: "文章管理", robots: { index: false } };

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");
  const posts = await getPostsByAuthor(user.is_admin ? "all" : user.id);
  return (
    <div className="card page-card">
      <div className="me-head">
        <div className="avatar small">{user.display_name.slice(0, 1)}</div>
        <div>
          <h1 className="page-title">{user.display_name}</h1>
          <span className="muted">
            @{user.username}
            {user.is_admin && <span className="admin-badge">管理员</span>} · {user.is_admin ? "全站" : "共"} {posts.length} 篇文章
          </span>
        </div>
        <Link href="/write" className="btn-primary">写文章</Link>
      </div>
      {posts.length === 0 ? (
        <p className="empty">还没有发表文章，<Link href="/write" className="link">去写第一篇</Link>吧～</p>
      ) : (
        <ul className="my-posts">
          {posts.map((p) => (
            <li key={p.slug}>
              <div>
                <Link href={`/posts/${p.slug}`} className="my-post-title">{p.title}</Link>
                <div className="muted">
                  {formatDate(p.date)} · {p.category} · {p.words} 字{user.is_admin && ` · 作者：${p.author}`}
                </div>
              </div>
              <div className="my-post-actions">
                <Link href={`/write/${p.slug}`}>编辑</Link>
                <form action={deleteArticle}>
                  <input type="hidden" name="slug" value={p.slug} />
                  <DeleteButton />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
