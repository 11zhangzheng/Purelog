import { site } from "@/lib/site";

export const metadata = { title: "关于" };

export default function AboutPage() {
  return (
    <div className="card page-card markdown-body">
      <h1>关于我</h1>
      <p>你好，我是 {site.author}，{site.bio}。</p>
      <p>这里记录我在前端、后端、工程化等方向上的学习与实践。欢迎通过 GitHub 与我交流。</p>
      <h2>本站</h2>
      <ul>
        <li>基于 Next.js App Router 构建，全站静态生成</li>
        <li>文章使用 Markdown 编写，存放于 <code>posts/</code> 目录</li>
        <li>部署于 Vercel，支持 RSS 订阅与站内搜索</li>
      </ul>
      <p>
        <a href={site.github} target="_blank" rel="noopener noreferrer">GitHub</a> · <a href="/rss.xml">RSS</a>
      </p>
    </div>
  );
}
