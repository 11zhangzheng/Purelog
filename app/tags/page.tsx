import Link from "next/link";
import { getTags } from "@/lib/posts";

export const metadata = { title: "标签" };

export default async function TagsPage() {
  const tags = await getTags();
  return (
    <div className="card page-card">
      <h1 className="page-title">全部标签 <small>{tags.length}</small></h1>
      <div className="tag-cloud big">
        {tags.map((t) => (
          <Link key={t.name} href={`/tags/${encodeURIComponent(t.name)}`} className="tag">
            {t.name}
            <small>{t.count}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
