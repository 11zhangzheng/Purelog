"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索文章" aria-label="搜索文章" />
      <button type="submit" aria-label="搜索">
        ⌕
      </button>
    </form>
  );
}
