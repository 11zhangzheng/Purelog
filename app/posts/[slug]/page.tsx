import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import type { Metadata } from "next";
import ArticleActions from "@/components/ArticleActions";
import Avatar from "@/components/Avatar";
import CommentSection from "@/components/CommentSection";
import DeleteButton from "@/components/DeleteButton";
import FollowButton from "@/components/FollowButton";
import Toc from "@/components/Toc";
import { deleteArticle } from "@/app/actions";
import { canManage, getCurrentUser } from "@/lib/auth";
import {
  formatCount,
  formatDate,
  getComments,
  getInteraction,
  getMorePostsByAuthor,
  getPost,
  getProfile,
  getRelated,
  incrementViews,
} from "@/lib/posts";

type Params = Promise<{ slug: string }>;

const loadPost = cache((slug: string) => getPost(slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await loadPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    keywords: post.tags,
    authors: [{ name: post.author.display_name }],
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      modifiedTime: post.updated,
      tags: post.tags,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const post = await loadPost((await params).slug);
  if (!post) notFound();
  const user = await getCurrentUser();
  const [interaction, comments, related, more, author] = await Promise.all([
    getInteraction(user?.id, post.id, post.author.id),
    getComments(post.id, user?.id),
    getRelated(post),
    getMorePostsByAuthor(post.author.id, post.id),
    getProfile(post.author.username),
  ]);
  // 阅读数在响应发送后再累加，不阻塞渲染
  after(() => incrementViews(post.id).catch(() => {}));

  const canEdit = canManage(user, post.author.id);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    dateModified: post.updated,
    author: { "@type": "Person", name: post.author.display_name },
    description: post.summary,
  };

  return (
    <div className="article-layout">
      <ArticleActions
        articleId={post.id}
        title={post.title}
        likes={post.likes}
        comments={post.comments}
        favorites={post.favorites}
        liked={interaction.liked}
        favorited={interaction.favorited}
      />
      <div className="article-main">
        <article className="card article">
          <h1 className="article-title">{post.title}</h1>
          <div className="article-meta">
            <Link href={`/user/${post.author.username}`} className="author">
              {post.author.display_name}
            </Link>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>◉ {formatCount(post.views + 1)}</span>
            <span>阅读 {post.readingMinutes} 分钟</span>
            {canEdit && (
              <span className="article-manage">
                <Link href={`/write/${post.slug}`} className="link">编辑</Link>
                <form action={deleteArticle}>
                  <input type="hidden" name="slug" value={post.slug} />
                  <DeleteButton />
                </form>
              </span>
            )}
          </div>
          {post.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="article-cover" src={post.cover} alt={post.title} />
          )}
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: post.html }} />
          <div className="article-footer">
            <div className="article-tags">
              <span className="muted">分类：</span>
              <Link href={`/c/${post.category}`} className="tag">{post.categoryName}</Link>
              {post.tags.length > 0 && <span className="muted">标签：</span>}
              {post.tags.map((t) => (
                <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="tag">{t}</Link>
              ))}
            </div>
          </div>
        </article>
        <CommentSection
          articleId={post.id}
          authorId={post.author.id}
          comments={comments}
          total={post.comments}
          viewer={user && { id: user.id, username: user.username, display_name: user.display_name, avatar: user.avatar, is_admin: user.is_admin }}
        />
        {related.length > 0 && (
          <section className="card">
            <h3 className="card-title">相关推荐</h3>
            <ul className="related">
              {related.map((p) => (
                <li key={p.id}>
                  <Link href={`/posts/${p.slug}`}>{p.title}</Link>
                  <span className="muted">
                    {p.author.display_name} · 👍 {p.likes} · 💬 {p.comments}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <aside className="article-side">
        {author && (
          <section className="card author-card">
            <Link href={`/user/${author.username}`} className="author-card-head">
              <Avatar user={author} size={48} />
              <div>
                <div className="author-name">{author.display_name}</div>
                <div className="muted">{author.title || author.bio || "这个人很懒，什么都没写"}</div>
              </div>
            </Link>
            <div className="stats">
              <div><b>{author.articles}</b><span>文章</span></div>
              <div><b>{formatCount(author.views)}</b><span>阅读</span></div>
              <div><b>{author.followers}</b><span>粉丝</span></div>
            </div>
            {user?.id !== author.id && <FollowButton userId={author.id} initial={interaction.following} />}
          </section>
        )}
        <div className="sticky-side">
          <Toc headings={post.headings} />
          {more.length > 0 && (
            <section className="card">
              <h3 className="card-title">作者的其他文章</h3>
              <ul className="related">
                {more.map((p) => (
                  <li key={p.id}>
                    <Link href={`/posts/${p.slug}`}>{p.title}</Link>
                    <span className="muted">◉ {p.views} · 👍 {p.likes}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </aside>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
