"use client";
import { useEffect, useState } from "react";
import type { Heading } from "@/lib/posts";

export default function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState("");
  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      let cur = "";
      for (const el of els) if (el.getBoundingClientRect().top < 100) cur = el.id;
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);
  if (!headings.length) return null;
  return (
    <nav className="card toc">
      <h3 className="card-title">目录</h3>
      <ul>
        {headings.map((h) => (
          <li key={h.id} className={`lv${h.level} ${active === h.id ? "active" : ""}`}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
