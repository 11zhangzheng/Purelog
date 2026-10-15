"use client";
import { useEffect, useState } from "react";

export default function ArticleTools({ title }: { title: string }) {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0);
      setShowTop(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // 代码块复制按钮
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

  const share = async () => {
    const url = location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
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
      <div className="article-suspended">
        <button className="suspend-btn" onClick={share} title="分享">
          {copied ? "✓" : "⤴"}
        </button>
        <a className="suspend-btn" href="#comments" title="评论">
          ✎
        </a>
        {showTop && (
          <button className="suspend-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="回到顶部">
            ↑
          </button>
        )}
      </div>
    </>
  );
}
