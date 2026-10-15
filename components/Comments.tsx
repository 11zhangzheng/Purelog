"use client";
import { useEffect, useRef } from "react";

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

// 基于 GitHub Discussions 的 giscus 评论，配置环境变量后自动启用
export default function Comments() {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = Boolean(repo && repoId && categoryId);

  useEffect(() => {
    if (!ref.current || !enabled) return;
    const s = document.createElement("script");
    const attrs: Record<string, string> = {
      src: "https://giscus.app/client.js",
      "data-repo": repo!,
      "data-repo-id": repoId!,
      "data-category": category || "Announcements",
      "data-category-id": categoryId!,
      "data-mapping": "pathname",
      "data-reactions-enabled": "1",
      "data-input-position": "top",
      "data-theme": document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      "data-lang": "zh-CN",
      crossorigin: "anonymous",
    };
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.async = true;
    ref.current.innerHTML = "";
    ref.current.appendChild(s);
  }, [enabled]);

  return (
    <section id="comments" className="card comments">
      <h3 className="card-title">评论</h3>
      {enabled ? <div ref={ref} /> : <p className="muted">评论功能未启用（配置 giscus 环境变量后自动开启）。</p>}
    </section>
  );
}
