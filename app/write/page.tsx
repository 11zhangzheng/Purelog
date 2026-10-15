import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Editor from "./Editor";

export const metadata = { title: "写文章", robots: { index: false } };

export default async function WritePage() {
  if (!(await getCurrentUser())) redirect("/login?next=/write");
  return <Editor initial={{ title: "", content: "", category: "", tags: "", summary: "", cover: "" }} />;
}
