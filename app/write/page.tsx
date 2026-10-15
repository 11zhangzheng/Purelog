import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/posts";
import Editor from "./Editor";

export const metadata = { title: "写文章", robots: { index: false } };

export default async function WritePage() {
  if (!(await getCurrentUser())) redirect("/login?next=/write");
  const categories = (await getCategories()).map((c) => c.name);
  return <Editor initial={{ title: "", content: "", category: "", tags: "", summary: "", cover: "" }} categories={categories} />;
}
