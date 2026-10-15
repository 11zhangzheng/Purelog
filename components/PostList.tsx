import type { PostMeta } from "@/lib/posts";
import PostCard from "./PostCard";

export default function PostList({ posts, empty = "暂无文章" }: { posts: PostMeta[]; empty?: string }) {
  return (
    <div className="card post-list">
      {posts.length ? posts.map((p) => <PostCard key={p.slug} post={p} />) : <p className="empty">{empty}</p>}
    </div>
  );
}
