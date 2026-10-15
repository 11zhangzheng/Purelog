import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleTools from "@/components/ArticleTools";
import Comments from "@/components/Comments";
import Toc from "@/components/Toc";
import { formatDate, getAdjacent, getPost, getRelated } from "@/lib/posts";
import { site } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    keywords: post.tags,
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

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const { newer, older } = await getAdjacent(post.slug);
  const related = await getRelated(post);
  const user = await getCurrentUser();
  const canEdit = post.source === "db" && user?.id === post.authorId;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { "@type": "Person", name: post.author },
    description: post.summary,
  };

  return (
    <div className="layout">
      <ArticleTools title={post.title} />
      <div className="content">
        <article className="card article">
          <h1 className="article-title">{post.title}</h1>
          <div className="article-meta">
            <span className="author">{post.author}</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>约 {post.words} 字</span>
            <span>阅读 {post.readingMinutes} 分钟</span>
            {canEdit && <Link href={`/write/${post.slug}`} className="link">编辑</Link>}
          </div>
          {post.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="article-cover" src={post.cover} alt={post.title} />
          )}
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: post.html }} />
          <div className="article-footer">
            <div className="article-tags">
              <span className="muted">分类：</span>
              <Link href={`/category/${encodeURIComponent(post.category)}`} className="tag">{post.category}</Link>
              {post.tags.length > 0 && <span className="muted">标签：</span>}
              {post.tags.map((t) => (
                <Link key={t} href={`/tags/${encodeURIComponent(t)}`} className="tag">{t}</Link>
              ))}
            </div>
            <nav className="post-nav">
              {newer ? <Link href={`/posts/${newer.slug}`}>← {newer.title}</Link> : <span />}
              {older ? <Link href={`/posts/${older.slug}`}>{older.title} →</Link> : <span />}
            </nav>
          </div>
        </article>
        <Comments />
      </div>
      <aside className="sidebar sticky">
        <Toc headings={post.headings} />
        {related.length > 0 && (
          <section className="card">
            <h3 className="card-title">相关推荐</h3>
            <ul className="related">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link href={`/posts/${p.slug}`}>{p.title}</Link>
                  <span className="muted">{formatDate(p.date)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
