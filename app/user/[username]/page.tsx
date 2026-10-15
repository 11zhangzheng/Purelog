import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import { parsePage } from "@/components/Feed";
import FollowButton from "@/components/FollowButton";
import Pagination from "@/components/Pagination";
import { PostList } from "@/components/PostCard";
import { getCurrentUser } from "@/lib/auth";
import { formatCount, formatDate, getFollowList, getProfile, getInteraction, listPosts } from "@/lib/posts";

type Params = Promise<{ username: string }>;
type SP = Promise<{ tab?: string; page?: string }>;

const TABS = [
  { key: "posts", label: "文章" },
  { key: "likes", label: "赞" },
  { key: "favorites", label: "收藏" },
  { key: "following", label: "关注" },
  { key: "followers", label: "粉丝" },
] as const;

export async function generateMetadata({ params }: { params: Params }) {
  const profile = await getProfile((await params).username).catch(() => null);
  return profile ? { title: `${profile.display_name} 的个人主页`, description: profile.bio } : {};
}

export default async function UserPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "posts";
  const page = parsePage(sp.page);
  const viewer = await getCurrentUser();
  const isMe = viewer?.id === profile.id;
  const following = viewer && !isMe ? (await getInteraction(viewer.id, 0, profile.id)).following : false;
  const base = `/user/${profile.username}`;

  let content: React.ReactNode;
  if (tab === "following" || tab === "followers") {
    const list = await getFollowList(profile.id, tab, viewer?.id);
    content = list.length ? (
      <ul className="user-list">
        {list.map((u) => (
          <li key={u.id}>
            <Link href={`/user/${u.username}`} className="user-list-item">
              <Avatar user={u} size={44} />
              <div>
                <div className="author-rank-name">{u.display_name}</div>
                <div className="muted">{u.bio || u.title || `${u.articles} 篇文章 · 获赞 ${u.likes}`}</div>
              </div>
            </Link>
            {viewer?.id !== u.id && <FollowButton userId={u.id} initial={Boolean(u.followed)} small />}
          </li>
        ))}
      </ul>
    ) : (
      <div className="empty">{tab === "following" ? "还没有关注任何人" : "还没有粉丝"}</div>
    );
  } else {
    const filter = tab === "likes" ? { likedBy: profile.id } : tab === "favorites" ? { favoritedBy: profile.id } : { authorId: profile.id };
    const data = await listPosts({ ...filter, sort: "latest", page });
    content = (
      <>
        <PostList
          posts={data.items}
          empty={tab === "posts" ? (isMe ? <>还没有发表文章，<Link href="/write" className="link">去写第一篇</Link></> : "暂无文章") : "暂无内容"}
        />
        <Pagination page={data.page} pages={data.pages} base={tab === "posts" ? base : `${base}?tab=${tab}`} />
      </>
    );
  }

  return (
    <div className="two-col">
      <div className="feed-main">
        <section className="card profile-head">
          <Avatar user={profile} size={88} />
          <div className="profile-info">
            <h1>
              {profile.display_name}
              {profile.is_admin && <span className="admin-badge">管理员</span>}
              {profile.is_banned && <span className="banned-badge">已禁言</span>}
            </h1>
            <div className="muted">@{profile.username}{profile.title && ` · ${profile.title}`}</div>
            <p className="profile-bio">{profile.bio || "这个人很懒，什么都没写"}</p>
          </div>
          <div className="profile-actions">
            {isMe ? (
              <Link href="/settings" className="btn-outline">编辑资料</Link>
            ) : (
              <FollowButton userId={profile.id} initial={following} />
            )}
          </div>
        </section>
        <div className="card feed-card">
          <nav className="profile-tabs">
            {TABS.map((t) => (
              <Link key={t.key} href={t.key === "posts" ? base : `${base}?tab=${t.key}`} className={tab === t.key ? "active" : ""}>
                {t.label}
                {t.key === "posts" && <small>{profile.articles}</small>}
                {t.key === "following" && <small>{profile.following}</small>}
                {t.key === "followers" && <small>{profile.followers}</small>}
              </Link>
            ))}
          </nav>
          {content}
        </div>
      </div>
      <aside className="right-sidebar">
        <section className="card">
          <h3 className="card-title">个人成就</h3>
          <ul className="achievements">
            <li>👍 文章被点赞 <b>{formatCount(profile.likes)}</b></li>
            <li>◉ 文章被阅读 <b>{formatCount(profile.views)}</b></li>
          </ul>
        </section>
        <section className="card follow-stats">
          <Link href={`${base}?tab=following`}>
            <span className="muted">关注了</span>
            <b>{profile.following}</b>
          </Link>
          <Link href={`${base}?tab=followers`}>
            <span className="muted">关注者</span>
            <b>{profile.followers}</b>
          </Link>
        </section>
        <div className="side-footer muted">加入于 {formatDate(profile.created_at)}</div>
      </aside>
    </div>
  );
}
