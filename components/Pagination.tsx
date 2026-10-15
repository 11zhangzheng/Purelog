import Link from "next/link";

export default function Pagination({ page, total }: { page: number; total: number }) {
  if (total <= 1) return null;
  const href = (n: number) => (n === 1 ? "/" : `/page/${n}`);
  return (
    <nav className="pagination" aria-label="分页">
      {page > 1 ? <Link href={href(page - 1)}>上一页</Link> : <span className="disabled">上一页</span>}
      {Array.from({ length: total }, (_, i) => i + 1).map((n) =>
        n === page ? (
          <span key={n} className="current">
            {n}
          </span>
        ) : (
          <Link key={n} href={href(n)}>
            {n}
          </Link>
        ),
      )}
      {page < total ? <Link href={href(page + 1)}>下一页</Link> : <span className="disabled">下一页</span>}
    </nav>
  );
}
