import Link from "next/link";

// base 为不含 page 参数的链接，例如 "/?sort=hot" 或 "/tag/React"
export default function Pagination({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const href = (n: number) => {
    const [path, qs = ""] = base.split("?");
    const sp = new URLSearchParams(qs);
    if (n === 1) sp.delete("page");
    else sp.set("page", String(n));
    const s = sp.toString();
    return s ? `${path}?${s}` : path;
  };
  // 只展示当前页附近的页码
  const nums = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <nav className="pagination" aria-label="分页">
      {page > 1 ? <Link href={href(page - 1)}>上一页</Link> : <span className="disabled">上一页</span>}
      {nums.map((n, i) => (
        <span key={n} className="page-group">
          {i > 0 && n - nums[i - 1] > 1 && <span className="ellipsis">…</span>}
          {n === page ? <span className="current">{n}</span> : <Link href={href(n)}>{n}</Link>}
        </span>
      ))}
      {page < pages ? <Link href={href(page + 1)}>下一页</Link> : <span className="disabled">下一页</span>}
    </nav>
  );
}
