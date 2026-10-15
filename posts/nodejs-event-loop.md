---
title: 一文搞懂 Node.js 事件循环
date: 2026-09-28
category: 后端
tags: [Node.js, JavaScript]
summary: 图解 Node.js 事件循环的六个阶段，以及 process.nextTick、Promise 与 setImmediate 的执行顺序。
---

## 事件循环的六个阶段

1. **timers**：执行 `setTimeout` / `setInterval` 回调
2. **pending callbacks**：执行延迟到下一轮的 I/O 回调
3. **idle, prepare**：内部使用
4. **poll**：获取新的 I/O 事件
5. **check**：执行 `setImmediate` 回调
6. **close callbacks**：如 `socket.on('close')`

## 微任务

每个阶段之间都会清空微任务队列，`process.nextTick` 优先于 Promise。

```js
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("nextTick"));
// nextTick -> promise -> timeout/immediate（顺序不确定）
```

## 在 I/O 回调中

```js
const fs = require("fs");
fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// 一定是 immediate -> timeout
```

因为 poll 阶段结束后紧接着是 check 阶段。
