// 首次启动时写入的示例文章（作者为管理员）
export const seedArticles = [
  {
    "title": "CSS Grid 布局实战：十分钟搭建响应式页面",
    "category": "frontend",
    "tags": [
      "CSS",
      "布局"
    ],
    "summary": "通过几个常见场景掌握 CSS Grid：圣杯布局、卡片自适应、侧边栏布局。",
    "content": "## 卡片自适应\n\n```css\n.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));\n  gap: 16px;\n}\n```\n\n`auto-fill` 配合 `minmax` 可以在不写媒体查询的情况下实现响应式。\n\n## 侧边栏布局\n\n```css\n.layout {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 280px;\n  gap: 20px;\n}\n```\n\n> 小技巧：使用 `minmax(0, 1fr)` 而不是 `1fr`，可以防止长代码块撑破布局。\n\n## 命名区域\n\n```css\n.page {\n  display: grid;\n  grid-template-areas:\n    \"header header\"\n    \"main   aside\"\n    \"footer footer\";\n}\n```",
    "date": "2026-09-12T00:00:00.000Z"
  },
  {
    "title": "团队协作中的 Git 工作流与提交规范",
    "category": "tools",
    "tags": [
      "Git",
      "工程化"
    ],
    "summary": "介绍 Git Flow、Trunk Based 两种工作流，以及 Conventional Commits 提交规范。",
    "content": "## 常见工作流\n\n### Git Flow\n\n适合有固定发布周期的项目，分支包括 `main`、`develop`、`feature/*`、`release/*`、`hotfix/*`。\n\n### Trunk Based\n\n所有人频繁合入主干，配合特性开关与 CI，适合持续部署。\n\n## 提交规范\n\n```bash\nfeat: 新增文章搜索功能\nfix: 修复深色模式下代码块颜色\ndocs: 更新部署文档\nrefactor: 重构文章解析逻辑\n```\n\n## 常用命令\n\n```bash\ngit rebase -i HEAD~3      # 整理提交\ngit commit --amend        # 修改最近一次提交\ngit cherry-pick <hash>    # 挑选提交\n```",
    "date": "2026-08-30T00:00:00.000Z"
  },
  {
    "title": "欢迎来到 Purelog：社区使用指南",
    "category": "life",
    "tags": [
      "社区",
      "指南"
    ],
    "summary": "Purelog 是开发者的技术分享社区。这篇文章介绍如何注册、发布文章、点赞评论以及关注作者。",
    "content": "欢迎来到 **Purelog**！这是一个面向开发者的技术内容社区，每个人都可以在这里写文章、交流技术。\n\n## 快速开始\n\n1. 点击右上角 **登录 | 注册**，创建你的账号\n2. 点击 **创作者中心** 进入编辑器，用 Markdown 写下你的第一篇文章\n3. 选择分类、添加标签，点击 **发布文章**\n\n## 和其他开发者互动\n\n- 👍 **点赞**：觉得文章不错，就给作者一个赞\n- 💬 **评论**：在文章底部留言，也可以回复其他人的评论\n- ★ **收藏**：收藏的文章可以在个人主页的「收藏」中找到\n- **关注**：关注喜欢的作者，在「关注」频道查看他们的最新文章\n\n## Markdown 小贴士\n\n```js\n// 代码块支持语法高亮，鼠标悬停可一键复制\nconsole.log(\"Hello, Purelog!\");\n```\n\n> 引用、表格、列表、链接、图片等常用语法都支持。\n\n| 快捷操作 | 说明 |\n| --- | --- |\n| Ctrl + Enter | 在评论框中快速发送 |\n| 右上角 ☾ | 切换深色模式 |\n\n## 社区公约\n\n平等表达，友善交流。请勿发布广告、灌水或违法违规内容，违规账号将被禁言。\n\n祝你在 Purelog 玩得开心！🎉",
    "date": "2026-10-15T00:00:00.000Z"
  },
  {
    "title": "一文搞懂 Node.js 事件循环",
    "category": "backend",
    "tags": [
      "Node.js",
      "JavaScript"
    ],
    "summary": "图解 Node.js 事件循环的六个阶段，以及 process.nextTick、Promise 与 setImmediate 的执行顺序。",
    "content": "## 事件循环的六个阶段\n\n1. **timers**：执行 `setTimeout` / `setInterval` 回调\n2. **pending callbacks**：执行延迟到下一轮的 I/O 回调\n3. **idle, prepare**：内部使用\n4. **poll**：获取新的 I/O 事件\n5. **check**：执行 `setImmediate` 回调\n6. **close callbacks**：如 `socket.on('close')`\n\n## 微任务\n\n每个阶段之间都会清空微任务队列，`process.nextTick` 优先于 Promise。\n\n```js\nsetTimeout(() => console.log(\"timeout\"), 0);\nsetImmediate(() => console.log(\"immediate\"));\nPromise.resolve().then(() => console.log(\"promise\"));\nprocess.nextTick(() => console.log(\"nextTick\"));\n// nextTick -> promise -> timeout/immediate（顺序不确定）\n```\n\n## 在 I/O 回调中\n\n```js\nconst fs = require(\"fs\");\nfs.readFile(__filename, () => {\n  setTimeout(() => console.log(\"timeout\"), 0);\n  setImmediate(() => console.log(\"immediate\"));\n});\n// 一定是 immediate -> timeout\n```\n\n因为 poll 阶段结束后紧接着是 check 阶段。",
    "date": "2026-09-28T00:00:00.000Z"
  },
  {
    "title": "深入理解 React Hooks：从 useState 到自定义 Hook",
    "category": "frontend",
    "tags": [
      "React",
      "JavaScript"
    ],
    "summary": "从闭包的角度理解 Hooks 的工作原理，并总结编写自定义 Hook 的最佳实践。",
    "content": "Hooks 让函数组件拥有了状态与副作用的能力。理解它的关键在于 **闭包** 与 **调用顺序**。\n\n## useState 的本质\n\n每次渲染都是一次独立的函数调用，state 是这次渲染的快照：\n\n```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  const handleClick = () => {\n    setTimeout(() => alert(count), 3000); // 读取的是点击时那次渲染的 count\n  };\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}\n```\n\n### 函数式更新\n\n当新状态依赖旧状态时，使用函数式更新避免闭包陷阱：\n\n```js\nsetCount((c) => c + 1);\n```\n\n## useEffect 的依赖\n\n依赖数组告诉 React 何时重新执行副作用。**不要对依赖撒谎**，否则会读取到过期的值。\n\n## 自定义 Hook\n\n```ts\nimport { useEffect, useState } from \"react\";\n\nexport function useDebounce<T>(value: T, delay = 300) {\n  const [v, setV] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setV(value), delay);\n    return () => clearTimeout(t);\n  }, [value, delay]);\n  return v;\n}\n```\n\n## 总结\n\n1. 每次渲染都有自己的 props 与 state\n2. Hook 只能在顶层调用\n3. 抽离可复用逻辑到自定义 Hook",
    "date": "2026-10-10T00:00:00.000Z"
  }
];
