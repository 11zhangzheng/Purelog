import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getArticleRow, getCategories } from "@/lib/posts";
import Editor from "../Editor";

export const metadata = { title: "编辑文章", robots: { index: false } };

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/write/${encodeURIComponent(slug)}`);
  const row = await getArticleRow(slug);
  if (!row || row.author_id !== user.id) notFound();
  const categories = (await getCategories()).map((c) => c.name);
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags);
  } catch {}
  return (
    <Editor
      initial={{
        id: String(row.id),
        title: row.title,
        content: row.content,
        category: row.category,
        tags: tags.join(", "),
        summary: row.summary,
        cover: row.cover ?? "",
      }}
      categories={categories}
    />
  );
}
