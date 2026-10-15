import { Suspense } from "react";
import SearchResults from "./SearchResults";

export const metadata = { title: "搜索" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="card page-card">加载中…</div>}>
      <SearchResults />
    </Suspense>
  );
}
