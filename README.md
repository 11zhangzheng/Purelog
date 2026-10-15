# Purelog

仿稀土掘金风格的个人博客，基于 Next.js（App Router）+ Markdown，全站静态生成，可一键部署到 Vercel。

## 功能
首页信息流 / 分类 Tab / 分页 · 文章页（代码高亮、复制、TOC、阅读进度、上下篇、相关推荐）· 标签 / 归档 / 关于 · 站内搜索 · 深色模式 · RSS / Sitemap / robots / JSON-LD · giscus 评论（可选）· 响应式

## 本地开发
```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 生产构建
```

## 写文章
在 `posts/` 下新建 `xxx.md`，文件名即 URL：
```yaml
---
title: 标题
date: 2026-10-15
category: 前端
tags: [React]
summary: 摘要（可选）
cover: /images/a.png  # 可选，图片放 public/
draft: false          # true 时生产环境不发布
---
```
站点名称、作者、简介、GitHub 等在 `lib/site.ts` 中修改。

## 部署到 Vercel
1. 推送到 GitHub
2. 在 [vercel.com/new](https://vercel.com/new) 导入仓库，框架自动识别为 Next.js，直接 Deploy
3. （可选）在 Project Settings → Environment Variables 中配置 `.env.example` 里的变量
