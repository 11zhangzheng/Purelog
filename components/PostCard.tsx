import Link from "next/link";
import { formatDate, type PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="post-card">
      <div className="post-card-meta">
        <span>{formatDate(post.date)}</span>
        <span className="divider" />
        <Link href={`/category/${encodeURIComponent(post.category)}`}>{post.category}</Link>
        {post.tags.length > 0 && <span className="divider" />}
        {post.tags.map((t) => (
          <Link key={t} href={`/tags/${encodeURIComponent(t)}`} className="meta-tag">
            {t}
          </Link>
        ))}
      </div>
      <div className="post-card-body">
        <div className="post-card-text">
          <h2>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h2>
          <p>{post.summary}</p>
          <div className="post-card-foot">
            <span>约 {post.words} 字</span>
            <span>阅读 {post.readingMinutes} 分钟</span>
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
