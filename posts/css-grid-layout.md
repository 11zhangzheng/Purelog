---
title: CSS Grid 布局实战：十分钟搭建响应式页面
date: 2026-09-12
category: 前端
tags: [CSS, 布局]
summary: 通过几个常见场景掌握 CSS Grid：圣杯布局、卡片自适应、侧边栏布局。
---

## 卡片自适应

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
```

`auto-fill` 配合 `minmax` 可以在不写媒体查询的情况下实现响应式。

## 侧边栏布局

```css
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
}
```

> 小技巧：使用 `minmax(0, 1fr)` 而不是 `1fr`，可以防止长代码块撑破布局。

## 命名区域

```css
.page {
  display: grid;
  grid-template-areas:
    "header header"
    "main   aside"
    "footer footer";
}
```
