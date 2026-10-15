import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import CategoryTabs from "./CategoryTabs";
import Pagination from "./Pagination";
import PostList from "./PostList";
import Sidebar from "./Sidebar";

export async function totalPages() {
  return Math.max(1, Math.ceil((await getAllPosts()).length / site.pageSize));
}

export default async function HomeView({ page }: { page: number }) {
  const all = await getAllPosts();
  const posts = all.slice((page - 1) * site.pageSize, page * site.pageSize);
  return (
    <div className="layout">
      <div className="content">
        <CategoryTabs />
        <PostList posts={posts} />
        <Pagination page={page} total={Math.max(1, Math.ceil(all.length / site.pageSize))} />
      </div>
      <Sidebar />
    </div>
  );
}
