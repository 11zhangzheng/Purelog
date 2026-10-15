"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Item = { slug: string; title: string; summary: string; tags: string[]; category: string; date: string; text: string };

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchResults() {
  const q = (useSearchParams().get("q") || "").trim();
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    fetch("/search.json").then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, []);
  const results = useMemo(() => {
    if (!items || !q) return [];
    const words = q.toLowerCase().split(/\s+/);
    return items
      .map((it) => {
        const t = it.title.toLowerCase();
        const body = (it.summary + " " + it.tags.join(" ") + " " + it.category + " " + it.text).toLowerCase();
        let score = 0;
        for (const w of words) {
          if (t.includes(w)) score += 10;
          else if (body.includes(w)) score += 1;
          else return null;
        }
        return { it, score };
      })
      .filter((x): x is { it: Item; score: number } => !!x)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.it);
  }, [items, q]);

  return (
    <div className="card page-card">
      <h1 className="page-title">
        搜索 “{q}” {items && <small>找到 {results.length} 篇</small>}
      </h1>
      {!items ? (
        <p className="muted">加载中…</p>
      ) : results.length === 0 ? (
        <p className="empty">没有找到相关文章，换个关键词试试吧。</p>
      ) : (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.slug}>
              <Link href={`/posts/${r.slug}`}>{highlight(r.title, q)}</Link>
              <p>{highlight(r.summary, q)}</p>
              <span className="muted">{r.date.slice(0, 10)} · {r.category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
