import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { site } from "@/lib/site";
import SearchBox from "./SearchBox";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

const nav = [
  { href: "/", label: "首页" },
  { href: "/?sort=hot", label: "热榜" },
  { href: "/following", label: "关注" },
  { href: "/tags", label: "标签" },
];

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-mark">P</span>
          <span className="logo-text">{site.title}</span>
        </Link>
        <nav className="nav">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          <SearchBox />
          <Link href="/write" className="btn-primary write-btn">
            创作者中心
          </Link>
          <ThemeToggle />
          {user ? (
            <UserMenu user={{ username: user.username, display_name: user.display_name, avatar: user.avatar, is_admin: user.is_admin }} />
          ) : (
            <Link href="/login" className="login-link">
              登录 | 注册
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
