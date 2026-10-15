import Link from "next/link";
import { getAllPosts, getCategories, getTags } from "@/lib/posts";
import { site } from "@/lib/site";

export default function Sidebar() {
  const posts = getAllPosts();
  const tags = getTags();
  const cats = getCategories();
  const words = posts.reduce((s, p) => s + p.words, 0);
  return (
    <aside className="sidebar">
      <section className="card author-card">
        <div className="avatar">{site.author.slice(0, 1)}</div>
        <div className="author-name">{site.author}</div>
        <div className="author-bio">{site.bio}</div>
        <div className="stats">
          <div>
            <b>{posts.length}</b>
            <span>文章</span>
          </div>
          <div>
            <b>{cats.length}</b>
            <span>分类</span>
          </div>
          <div>
            <b>{words >= 10000 ? (words / 10000).toFixed(1) + "w" : words}</b>
            <span>字数</span>
          </div>
        </div>
        <a className="btn-primary" href={site.github} target="_blank" rel="noopener noreferrer">
          关注 GitHub
        </a>
      </section>
      <section className="card">
        <h3 className="card-title">热门标签</h3>
        <div className="tag-cloud">
          {tags.slice(0, 20).map((t) => (
            <Link key={t.name} href={`/tags/${encodeURIComponent(t.name)}`} className="tag">
              {t.name}
              <small>{t.count}</small>
            </Link>
          ))}
        </div>
      </section>
      <section className="card">
        <h3 className="card-title">最新文章</h3>
        <ol className="rank-list">
          {posts.slice(0, 5).map((p, i) => (
            <li key={p.slug}>
              <span className={`rank rank-${i + 1}`}>{i + 1}</span>
              <Link href={`/posts/${p.slug}`}>{p.title}</Link>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
