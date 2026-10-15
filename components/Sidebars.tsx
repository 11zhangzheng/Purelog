import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { formatCount, getAuthorRank, getHotTags, listPosts } from "@/lib/posts";
import { categories, site } from "@/lib/site";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

// 左侧频道导航
export function ChannelNav({ active }: { active?: string }) {
  return (
    <nav className="channel-nav card">
      <Link href="/" className={!active ? "active" : ""}>
        <span className="ch-icon">☰</span>综合
      </Link>
      <Link href="/following" className={active === "following" ? "active" : ""}>
        <span className="ch-icon">♥</span>关注
      </Link>
      {categories.map((c) => (
        <Link key={c.key} href={`/c/${c.key}`} className={active === c.key ? "active" : ""}>
          <span className="ch-icon">{c.icon || "◇"}</span>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

// 右侧边栏：欢迎卡片、热门文章、作者榜、热门标签
export async function RightSidebar() {
  const user = await getCurrentUser();
  const [hot, authors, tags] = await Promise.all([
    listPosts({ sort: "hot", days: 30, pageSize: 6 }).catch(() => null),
    getAuthorRank(5, user?.id).catch(() => []),
    getHotTags(16).catch(() => []),
  ]);
  return (
    <aside className="right-sidebar">
      <section className="card welcome-card">
        {user ? (
          <>
            <div className="welcome-user">
              <Avatar user={user} size={44} />
              <div>
                <div className="welcome-name">{user.display_name}</div>
                <div className="muted">{user.title || "开始你的创作之旅"}</div>
              </div>
            </div>
            <div className="welcome-actions">
              <Link href="/write" className="btn-primary">写文章</Link>
              <Link href={`/user/${user.username}`} className="btn-outline">我的主页</Link>
            </div>
          </>
        ) : (
          <>
            <div className="welcome-title">👋 欢迎来到 {site.title}</div>
            <p className="muted">{site.slogan}，写下你的技术思考，与开发者交流。</p>
            <div className="welcome-actions">
              <Link href="/login?mode=register" className="btn-primary">立即注册</Link>
              <Link href="/login" className="btn-outline">登录</Link>
            </div>
          </>
        )}
      </section>

      {hot && hot.items.length > 0 && (
        <section className="card">
          <h3 className="card-title">🔥 文章榜</h3>
          <ol className="rank-list">
            {hot.items.map((p, i) => (
              <li key={p.id}>
                <span className={`rank rank-${i + 1}`}>{i + 1}</span>
                <Link href={`/posts/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {authors.length > 0 && (
        <section className="card">
          <h3 className="card-title">🎖 作者榜</h3>
          <ul className="author-rank">
            {authors.map((a) => (
              <li key={a.id}>
                <Link href={`/user/${a.username}`} className="author-rank-user">
                  <Avatar user={a} size={36} />
                  <div>
                    <div className="author-rank-name">{a.display_name}</div>
                    <div className="muted">
                      {a.articles} 篇文章 · 获赞 {formatCount(a.likes)}
                    </div>
                  </div>
                </Link>
                {user?.id !== a.id && <FollowButton userId={a.id} initial={Boolean(a.followed)} small />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tags.length > 0 && (
        <section className="card">
          <h3 className="card-title">
            热门标签
            <Link href="/tags" className="card-more">全部 ›</Link>
          </h3>
          <div className="tag-cloud">
            {tags.map((t) => (
              <Link key={t.name} href={`/tag/${encodeURIComponent(t.name)}`} className="tag">
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="side-footer muted">
        © {new Date().getFullYear()} {site.title} · <Link href="/rss.xml">RSS</Link> · <Link href="/tags">标签</Link>
      </footer>
    </aside>
  );
}

// 文章流的排序 Tab
export function SortTabs({ base, sort }: { base: string; sort: string }) {
  const tabs = [
    { key: "recommend", label: "推荐" },
    { key: "latest", label: "最新" },
    { key: "hot", label: "热榜" },
  ];
  return (
    <div className="sort-tabs">
      {tabs.map((t) => (
        <Link key={t.key} href={t.key === "recommend" ? base : `${base}?sort=${t.key}`} className={sort === t.key ? "active" : ""}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
