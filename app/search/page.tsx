import Pagination from "@/components/Pagination";
import { PostList } from "@/components/PostCard";
import { RightSidebar } from "@/components/Sidebars";
import { parsePage } from "@/components/Feed";
import { listPosts } from "@/lib/posts";

type SP = Promise<{ q?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }) {
  const { q } = await searchParams;
  return { title: q ? `搜索：${q}` : "搜索", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = (sp.q || "").trim().slice(0, 50);
  const data = q ? await listPosts({ q, page: parsePage(sp.page) }).catch(() => null) : null;
  return (
    <div className="two-col">
      <div className="feed-main">
        <div className="card section-head">
          <h1>{q ? <>搜索 “{q}”</> : "搜索文章"}</h1>
          {data && <span className="muted">找到 {data.total} 篇相关文章</span>}
        </div>
        <div className="card feed-card">
          {!q ? (
            <div className="empty">在顶部搜索框输入关键词</div>
          ) : !data ? (
            <div className="empty">搜索失败，请稍后重试</div>
          ) : (
            <PostList posts={data.items} empty="没有找到相关文章，换个关键词试试吧" />
          )}
        </div>
        {data && <Pagination page={data.page} pages={data.pages} base={`/search?q=${encodeURIComponent(q)}`} />}
      </div>
      <RightSidebar />
    </div>
  );
}
