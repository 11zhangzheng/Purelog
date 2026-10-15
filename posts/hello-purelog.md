---
title: 你好，Purelog：博客使用指南
date: 2026-10-15
category: 随笔
tags: [博客, 指南]
summary: 介绍 Purelog 的写作方式、Front Matter 字段以及部署到 Vercel 的流程。
---

欢迎来到 **Purelog**！这是一个仿稀土掘金风格的个人博客，基于 Next.js 构建，全站静态生成。

## 如何写文章

在 `posts/` 目录新建一个 `.md` 文件，文件名即文章的 URL（slug）：

```markdown
---
title: 文章标题
date: 2026-10-15
category: 前端
tags: [React, Next.js]
summary: 文章摘要（可选，缺省时自动截取正文）
cover: /images/cover.png   # 可选
draft: false               # 草稿在生产环境不会发布
---

正文内容……
```

## 支持的功能

- 分类、标签、归档、分页
- 代码高亮与一键复制
- 文章目录（TOC）与阅读进度条
- 站内搜索、RSS、Sitemap
- 深色模式
- giscus 评论（可选）

## 部署

> 推送到 GitHub 后在 Vercel 导入仓库即可，无需任何额外配置。

| 环境变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 站点地址，用于 RSS / Sitemap |
| `NEXT_PUBLIC_GISCUS_*` | giscus 评论配置 |
