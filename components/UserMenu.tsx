"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/actions";

export default function UserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <div className="user-menu" ref={ref}>
      <button className="avatar tiny" onClick={() => setOpen(!open)} aria-label="用户菜单" title={name}>
        {name.slice(0, 1)}
      </button>
      {open && (
        <div className="user-dropdown card">
          <div className="user-dropdown-name">{name}</div>
          <Link href="/write" onClick={() => setOpen(false)}>写文章</Link>
          <Link href="/me" onClick={() => setOpen(false)}>文章管理</Link>
          <form action={logout}>
            <button>退出登录</button>
          </form>
        </div>
      )}
    </div>
  );
}
