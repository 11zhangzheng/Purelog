export const site = {
  title: "Purelog",
  slogan: "开发者的技术分享社区",
  description: "Purelog 是一个面向开发者的技术内容分享与交流社区，在这里写文章、点赞、评论、关注优秀的作者。",
  url: process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  github: "https://github.com/11zhangzheng",
  pageSize: 15,
};

// 社区固定频道（类似掘金左侧导航），key 用于 URL
export const categories = [
  { key: "backend", name: "后端", icon: "⚙" },
  { key: "frontend", name: "前端", icon: "◧" },
  { key: "android", name: "Android", icon: "◉" },
  { key: "ios", name: "iOS", icon: "" },
  { key: "ai", name: "人工智能", icon: "✦" },
  { key: "tools", name: "开发工具", icon: "⚒" },
  { key: "career", name: "代码人生", icon: "☕" },
  { key: "reading", name: "阅读", icon: "❏" },
  { key: "life", name: "随笔", icon: "✎" },
] as const;

export type CategoryKey = (typeof categories)[number]["key"];

export const categoryName = (key: string) => categories.find((c) => c.key === key)?.name ?? key;
export const isCategory = (key: string): key is CategoryKey => categories.some((c) => c.key === key);
