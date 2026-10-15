import Link from "next/link";
import { site } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";
import SearchBox from "./SearchBox";

const nav = [
  { href: "/", label: "首页" },
  { href: "/archive", label: "归档" },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
];

export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-mark">P</span>
          {site.title}
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
