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

## 网页端发布
点击顶栏「写文章」→ 未登录会跳转到登录 / 注册页 → 登录后进入 Markdown 编辑器（实时预览、本地自动保存草稿）→ 发布。
「我的文章」页可编辑、删除自己发表的文章。网页端文章存储在 Postgres 中，内容经过 XSS 过滤。

## 用 Markdown 文件写文章
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
1. 推送到 GitHub，在 [vercel.com/new](https://vercel.com/new) 导入仓库
2. 项目的 **Storage** 页创建一个 Postgres（Neon）数据库并连接到项目，会自动注入 `DATABASE_URL`，首次访问时自动建表
3. 在 Settings → Environment Variables 添加 `AUTH_SECRET`（`openssl rand -base64 32` 生成）
4. 建议设置 `REGISTER_INVITE_CODE`，只有拿到邀请码的人才能注册
5. Deploy（修改环境变量后需要 Redeploy）

其余可选变量见 `.env.example`。
