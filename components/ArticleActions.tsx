"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toggleFavorite, toggleLike } from "@/app/actions";

type Props = {
  articleId: number;
  title: string;
  likes: number;
  comments: number;
  favorites: number;
  liked: boolean;
  favorited: boolean;
};

// 文章左侧悬浮操作栏：点赞 / 评论 / 收藏 / 分享，并带阅读进度条与代码复制
export default function ArticleActions(p: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(p.liked);
  const [likes, setLikes] = useState(p.likes);
  const [fav, setFav] = useState(p.favorited);
  const [favs, setFavs] = useState(p.favorites);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, start] = useTransition();

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.querySelectorAll<HTMLPreElement>(".markdown-body pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "复制";
      btn.onclick = async () => {
        await navigator.clipboard.writeText(pre.querySelector("code")?.innerText ?? "");
        btn.textContent = "已复制";
        setTimeout(() => (btn.textContent = "复制"), 1500);
      };
      pre.appendChild(btn);
    });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const needLogin = () => router.push(`/login?next=${encodeURIComponent(location.pathname)}`);

  const like = () =>
    start(async () => {
      const next = !liked;
      setLiked(next);
      setLikes((n) => n + (next ? 1 : -1));
      const r = await toggleLike(p.articleId, next);
      if (!r.ok) {
        setLiked(!next);
        setLikes((n) => n - (next ? 1 : -1));
        if (r.login) needLogin();
      }
    });

  const favorite = () =>
    start(async () => {
      const next = !fav;
      setFav(next);
      setFavs((n) => n + (next ? 1 : -1));
      const r = await toggleFavorite(p.articleId, next);
      if (!r.ok) {
        setFav(!next);
        setFavs((n) => n - (next ? 1 : -1));
        if (r.login) needLogin();
      }
    });

  const share = async () => {
    const url = location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: p.title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <>
      <div className="read-progress" style={{ width: `${progress}%` }} />
      <div className="article-panel">
        <button className={`panel-btn ${liked ? "active" : ""}`} onClick={like} title="点赞" aria-pressed={liked}>
          <span className="panel-icon">👍</span>
          {likes > 0 && <span className="badge">{likes}</span>}
        </button>
        <a className="panel-btn" href="#comments" title="评论">
          <span className="panel-icon">💬</span>
          {p.comments > 0 && <span className="badge">{p.comments}</span>}
        </a>
        <button className={`panel-btn ${fav ? "active" : ""}`} onClick={favorite} title="收藏" aria-pressed={fav}>
          <span className="panel-icon">★</span>
          {favs > 0 && <span className="badge">{favs}</span>}
        </button>
        <button className="panel-btn" onClick={share} title="分享">
          <span className="panel-icon">{copied ? "✓" : "↗"}</span>
        </button>
      </div>
    </>
  );
}
