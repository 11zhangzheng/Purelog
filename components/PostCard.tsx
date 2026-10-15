import Link from "next/link";
import { formatCount, timeAgo, type PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="post-card">
      <div className="post-card-body">
        <div className="post-card-text">
          <h2>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h2>
          <p className="post-card-summary">{post.summary}</p>
          <div className="post-card-foot">
            <Link href={`/user/${post.author.username}`} className="post-card-author">
              {post.author.display_name}
            </Link>
            <span className="divider" />
            <span className="stat" title="阅读">◉ {formatCount(post.views)}</span>
            <span className="stat" title="点赞">👍 {formatCount(post.likes)}</span>
            <span className="stat" title="评论">💬 {formatCount(post.comments)}</span>
            <span className="divider hide-sm" />
            <span className="hide-sm">{timeAgo(post.date)}</span>
            <span className="post-card-tags">
              {post.tags.slice(0, 2).map((t) => (
                <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="tag-sm">
                  {t}
                </Link>
              ))}
            </span>
          </div>
        </div>
        {post.cover && (
          <Link href={`/posts/${post.slug}`} className="post-card-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover} alt={post.title} loading="lazy" />
          </Link>
        )}
      </div>
    </article>
  );
}

export function PostList({ posts, empty = "暂无文章" }: { posts: PostMeta[]; empty?: React.ReactNode }) {
  return (
    <div className="post-list">
      {posts.length ? posts.map((p) => <PostCard key={p.id} post={p} />) : <div className="empty">{empty}</div>}
    </div>
  );
}
