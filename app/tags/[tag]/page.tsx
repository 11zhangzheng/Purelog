import { notFound } from "next/navigation";
import PostList from "@/components/PostList";
import Sidebar from "@/components/Sidebar";
import { getAllPosts, getTags } from "@/lib/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTags().map((t) => ({ tag: t.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  return { title: `标签：${decodeURIComponent((await params).tag)}` };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const tag = decodeURIComponent((await params).tag);
  const posts = getAllPosts().filter((p) => p.tags.includes(tag));
  if (!posts.length) notFound();
  return (
    <div className="layout">
      <div className="content">
        <div className="card section-head">
          <h1># {tag}</h1>
          <span className="muted">共 {posts.length} 篇文章</span>
        </div>
        <PostList posts={posts} />
      </div>
      <Sidebar />
    </div>
  );
}
