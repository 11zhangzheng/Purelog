import Link from "next/link";
import { formatDate, getAllPosts, type PostMeta } from "@/lib/posts";

export const metadata = { title: "归档" };

export default async function ArchivePage() {
  const posts = await getAllPosts();
  const byYear = new Map<string, PostMeta[]>();
  posts.forEach((p) => {
    const y = p.date.slice(0, 4);
    byYear.set(y, [...(byYear.get(y) || []), p]);
  });
  return (
    <div className="card page-card">
      <h1 className="page-title">归档 <small>共 {posts.length} 篇</small></h1>
      {[...byYear.entries()].map(([year, list]) => (
        <section key={year} className="archive-year">
          <h2>{year}</h2>
          <ul className="timeline">
            {list.map((p) => (
              <li key={p.slug}>
                <time>{formatDate(p.date).slice(5)}</time>
                <Link href={`/posts/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
