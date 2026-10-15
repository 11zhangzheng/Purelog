import Link from "next/link";
import { getCategories } from "@/lib/posts";

export default function CategoryTabs({ active }: { active?: string }) {
  const cats = getCategories();
  return (
    <nav className="cat-tabs card">
      <Link href="/" className={!active ? "active" : ""}>
        综合
      </Link>
      {cats.map((c) => (
        <Link
          key={c.name}
          href={`/category/${encodeURIComponent(c.name)}`}
          className={active === c.name ? "active" : ""}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
