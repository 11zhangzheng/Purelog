"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/actions";
import Avatar from "./Avatar";

type U = { username: string; display_name: string; avatar: string | null; is_admin: boolean };

export default function UserMenu({ user }: { user: U }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  const item = (href: string, label: string) => (
    <Link href={href} onClick={() => setOpen(false)}>
      {label}
    </Link>
  );
  return (
    <div className="user-menu" ref={ref}>
      <button className="avatar-btn" onClick={() => setOpen(!open)} aria-label="用户菜单" title={user.display_name}>
        <Avatar user={user} size={34} />
      </button>
      {open && (
        <div className="user-dropdown card">
          <div className="user-dropdown-name">{user.display_name}</div>
          {item("/write", "✎ 写文章")}
          {item(`/user/${user.username}`, "我的主页")}
          {item(`/user/${user.username}?tab=favorites`, "我的收藏")}
          {item("/following", "关注动态")}
          {item("/settings", "账号设置")}
          {user.is_admin && item("/admin", "管理后台")}
          <form action={logout}>
            <button>退出登录</button>
          </form>
        </div>
      )}
    </div>
  );
}
