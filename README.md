# Purelog

一个纯粹的技术记录与分享平台：任何人都可以注册、发布文章，并互相点赞、评论、收藏、关注。
基于 Next.js（App Router）+ Postgres，可一键部署到 Vercel。

## 功能
- **首页**：三栏布局（频道导航 / 文章流 / 侧边栏），推荐 · 最新 · 热榜排序，分页
- **频道与标签**：后端、前端、Android、iOS、人工智能等固定频道；自由标签与标签广场
- **文章**：Markdown 编辑器（实时预览、本地草稿），代码高亮与复制、目录、阅读进度、阅读数
- **互动**：点赞、收藏、评论 + 楼中楼回复、评论点赞、关注作者、「关注」动态流
- **个人主页**：文章 / 赞 / 收藏 / 关注 / 粉丝，获赞与阅读统计；账号设置（资料、头像、改密码）
- **管理后台**（`/admin`）：站点统计、管理全站文章、禁言用户
- **安全**：scrypt 密码哈希、签名 httpOnly 会话、XSS 过滤、发文/评论频率限制、可选注册邀请码
- 站内搜索、深色模式、响应式、RSS、Sitemap、JSON-LD

## 本地开发
```bash
npm install
npm run dev     # http://localhost:3000
```
本地无需安装数据库：未配置 `DATABASE_URL` 时自动使用嵌入式数据库（`.data/`），首次启动会写入几篇示例文章。
删除 `.data` 文件夹即可清空本地数据。

**管理员**：本地默认账号 `admin` / `123456`（可用 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 修改）。
线上必须在环境变量中设置 `ADMIN_PASSWORD`（强密码）才会创建管理员。

## 部署到 Vercel
1. 推送到 GitHub，在 [vercel.com/new](https://vercel.com/new) 导入仓库
2. 项目的 **Storage** 页创建一个 Postgres（Neon）数据库并连接到项目，会自动注入 `DATABASE_URL`；数据表在首次访问时自动创建
3. 在 Settings → Environment Variables 添加：
   - `AUTH_SECRET`：`openssl rand -base64 32` 生成
   - `ADMIN_PASSWORD`：管理员密码（强密码）
4. Deploy（修改环境变量后需要 Redeploy）

其余可选变量（站点域名、注册邀请码、关闭示例文章等）见 `.env.example`。站点名称、频道列表在 `lib/site.ts` 中修改。
