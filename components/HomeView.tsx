import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import CategoryTabs from "./CategoryTabs";
import Pagination from "./Pagination";
import PostList from "./PostList";
import Sidebar from "./Sidebar";

export function totalPages() {
  return Math.max(1, Math.ceil(getAllPosts().length / site.pageSize));
}

export default function HomeView({ page }: { page: number }) {
  const all = getAllPosts();
  const posts = all.slice((page - 1) * site.pageSize, page * site.pageSize);
  return (
    <div className="layout">
      <div className="content">
        <CategoryTabs />
        <PostList posts={posts} />
        <Pagination page={page} total={totalPages()} />
      </div>
      <Sidebar />
    </div>
  );
}
