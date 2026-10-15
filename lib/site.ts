export const site = {
  title: "Purelog",
  description: "一个专注技术分享的个人博客",
  author: "Atom",
  bio: "全栈开发者 · 热爱开源与写作",
  url: process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  github: "https://github.com/11zhangzheng",
  pageSize: 10,
};
