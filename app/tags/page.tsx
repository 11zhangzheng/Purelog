import Link from "next/link";
import { getHotTags } from "@/lib/posts";

export const metadata = { title: "全部标签" };

export default async function TagsPage() {
  const tags = await getHotTags(300).catch(() => []);
  return (
    <div className="narrow">
      <div className="card page-card">
        <h1 className="page-title">
          全部标签 <small>{tags.length}</small>
        </h1>
        {tags.length === 0 ? (
          <p className="empty">暂无标签</p>
        ) : (
          <div className="tag-grid">
            {tags.map((t) => (
              <Link key={t.name} href={`/tag/${encodeURIComponent(t.name)}`} className="tag-tile">
                <b># {t.name}</b>
                <span className="muted">{t.count} 篇文章</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
