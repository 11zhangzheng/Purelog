import Link from "next/link";
import { redirect } from "next/navigation";
import Feed, { parsePage } from "@/components/Feed";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "关注" };

export default async function FollowingPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/following");
  const sp = await searchParams;
  return (
    <Feed
      channel="following"
      base="/following"
      filter={{ followingOf: user.id }}
      sort="latest"
      page={parsePage(sp.page)}
      empty={<>你关注的作者还没有发布文章，去 <Link href="/" className="link">首页</Link> 发现更多优秀作者吧～</>}
    />
  );
}
