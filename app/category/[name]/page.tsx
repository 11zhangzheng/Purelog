import { notFound } from "next/navigation";
import CategoryTabs from "@/components/CategoryTabs";
import PostList from "@/components/PostList";
import Sidebar from "@/components/Sidebar";
import { getAllPosts } from "@/lib/posts";

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  return { title: `分类：${decodeURIComponent((await params).name)}` };
}

export default async function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  const posts = (await getAllPosts()).filter((p) => p.category === name);
  if (!posts.length) notFound();
  return (
    <div className="layout">
      <div className="content">
        <CategoryTabs active={name} />
        <PostList posts={posts} />
      </div>
      <Sidebar />
    </div>
  );
}
