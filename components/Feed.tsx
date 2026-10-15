import Link from "next/link";
import { listPosts, type ListFilter, type Sort } from "@/lib/posts";
import Pagination from "./Pagination";
import { PostList } from "./PostCard";
import { ChannelNav, RightSidebar, SortTabs } from "./Sidebars";

export function parseSort(s?: string): Sort {
  return s === "latest" || s === "hot" ? s : "recommend";
}

export function parsePage(p?: string) {
  const n = Number(p);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 1000) : 1;
}

// 掘金式三栏布局：频道导航 / 文章流 / 侧边栏
export default async function Feed({
  channel,
  base,
  filter,
  sort,
  page,
  header,
  empty,
}: {
  channel?: string;
  base: string;
  filter: ListFilter;
  sort: Sort;
  page: number;
  header?: React.ReactNode;
  empty?: React.ReactNode;
}) {
  const data = await listPosts({ ...filter, sort, page }).catch((e) => {
    console.error("[purelog]", e);
    return null;
  });
  const sortQs = sort === "recommend" ? base : `${base}?sort=${sort}`;
  return (
    <div className="feed-layout">
      <ChannelNav active={channel} />
      <div className="feed-main">
        {header}
        <div className="card feed-card">
          <SortTabs base={base} sort={sort} />
          {data ? (
            <PostList posts={data.items} empty={empty ?? <>暂无文章，<Link href="/write" className="link">来写第一篇</Link>吧～</>} />
          ) : (
            <div className="empty">数据加载失败，请检查数据库配置</div>
          )}
        </div>
        {data && <Pagination page={data.page} pages={data.pages} base={sortQs} />}
      </div>
      <RightSidebar />
    </div>
  );
}
