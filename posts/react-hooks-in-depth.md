---
title: 深入理解 React Hooks：从 useState 到自定义 Hook
date: 2026-10-10
category: 前端
tags: [React, JavaScript]
summary: 从闭包的角度理解 Hooks 的工作原理，并总结编写自定义 Hook 的最佳实践。
---

Hooks 让函数组件拥有了状态与副作用的能力。理解它的关键在于 **闭包** 与 **调用顺序**。

## useState 的本质

每次渲染都是一次独立的函数调用，state 是这次渲染的快照：

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    setTimeout(() => alert(count), 3000); // 读取的是点击时那次渲染的 count
  };
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 函数式更新

当新状态依赖旧状态时，使用函数式更新避免闭包陷阱：

```js
setCount((c) => c + 1);
```

## useEffect 的依赖

依赖数组告诉 React 何时重新执行副作用。**不要对依赖撒谎**，否则会读取到过期的值。

## 自定义 Hook

```ts
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
```

## 总结

1. 每次渲染都有自己的 props 与 state
2. Hook 只能在顶层调用
3. 抽离可复用逻辑到自定义 Hook
