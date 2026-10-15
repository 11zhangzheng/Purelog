"use client";

export default function DeleteButton({ label = "删除" }: { label?: string }) {
  return (
    <button
      className="link-danger"
      onClick={(e) => {
        if (!confirm("确定删除这篇文章吗？此操作不可恢复。")) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
