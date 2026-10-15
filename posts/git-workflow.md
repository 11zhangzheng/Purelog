---
title: 团队协作中的 Git 工作流与提交规范
date: 2026-08-30
category: 工程化
tags: [Git, 工程化]
summary: 介绍 Git Flow、Trunk Based 两种工作流，以及 Conventional Commits 提交规范。
---

## 常见工作流

### Git Flow

适合有固定发布周期的项目，分支包括 `main`、`develop`、`feature/*`、`release/*`、`hotfix/*`。

### Trunk Based

所有人频繁合入主干，配合特性开关与 CI，适合持续部署。

## 提交规范

```bash
feat: 新增文章搜索功能
fix: 修复深色模式下代码块颜色
docs: 更新部署文档
refactor: 重构文章解析逻辑
```

## 常用命令

```bash
git rebase -i HEAD~3      # 整理提交
git commit --amend        # 修改最近一次提交
git cherry-pick <hash>    # 挑选提交
```
