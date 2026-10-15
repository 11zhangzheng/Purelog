"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { categories } from "@/lib/site";
import { saveArticle } from "../actions";

export type EditorInitial = {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  summary: string;
  cover: string;
};

const DRAFT_KEY = "purelog_draft";

export default function Editor({ initial }: { initial: EditorInitial }) {
  const [state, action, pending] = useActionState(saveArticle, undefined);
  const v = { ...initial, ...state?.values };
  const [content, setContent] = useState(v.content);
  const [title, setTitle] = useState(v.title);
  const [preview, setPreview] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const restored = useRef(false);

  // 新文章：自动保存草稿到本地
  useEffect(() => {
    if (initial.id || restored.current) return;
    restored.current = true;
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (d && (d.title || d.content) && !title && !content) {
        setTitle(d.title || "");
        setContent(d.content || "");
      }
    } catch {}
  }, [initial.id, title, content]);
  useEffect(() => {
    if (initial.id) return;
    const t = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content })), 500);
    return () => clearTimeout(t);
  }, [title, content, initial.id]);

  // 实时预览（动态加载 marked，按需渲染）
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const [{ marked }, { default: DOMPurify }] = await Promise.all([import("marked"), import("dompurify")]);
      const html = DOMPurify.sanitize(marked.parse(content, { async: false }) as string);
      if (alive) setPreview(html);
    }, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [content]);

  const onSubmit = () => {
    if (!initial.id) localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <form action={action} onSubmit={onSubmit} className="editor">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="editor-top card">
        <input
          name="title"
          className="editor-title"
          placeholder="输入文章标题…"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button className="btn-primary" disabled={pending}>
          {pending ? "发布中…" : initial.id ? "更新文章" : "发布文章"}
        </button>
      </div>
      {state?.error && <p className="form-error card">{state.error}</p>}
      <div className="editor-meta card">
        <label>
          分类
          <select name="category" defaultValue={v.category} required>
            <option value="" disabled>
              请选择分类
            </option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          标签
          <input name="tags" placeholder="用逗号或空格分隔，最多 5 个" defaultValue={v.tags} />
        </label>
        <label>
          封面图链接
          <input name="cover" type="url" placeholder="https://…（选填）" defaultValue={v.cover} />
        </label>
        <label className="full">
          摘要
          <input name="summary" placeholder="选填，留空则自动截取正文" maxLength={200} defaultValue={v.summary} />
        </label>
      </div>
      <div className="editor-tabs">
        <button type="button" className={tab === "edit" ? "active" : ""} onClick={() => setTab("edit")}>
          编辑
        </button>
        <button type="button" className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}>
          预览
        </button>
      </div>
      <div className={`editor-body card tab-${tab}`}>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="支持 Markdown 语法，开始写作吧…"
          required
        />
        <div className="editor-preview markdown-body" dangerouslySetInnerHTML={{ __html: preview }} />
      </div>
      <div className="editor-foot muted">字数：{content.replace(/\s/g, "").length}</div>
    </form>
  );
}
