import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import { site } from "@/lib/site";
import "highlight.js/styles/github.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.title} - ${site.slogan}`, template: `%s - ${site.title}` },
  description: site.description,
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
  openGraph: { type: "website", siteName: site.title, title: `${site.title} - ${site.slogan}`, description: site.description, locale: "zh_CN" },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

// 在首帧前设置主题，避免闪烁
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header />
        <main className="container main">{children}</main>
      </body>
    </html>
  );
}
