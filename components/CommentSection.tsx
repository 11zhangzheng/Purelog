"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addComment, deleteComment, toggleCommentLike } from "@/app/actions";
import type { CommentItem } from "@/lib/posts";
import Avatar from "./Avatar";

type Viewer = { id: number; username: string; display_name: string; avatar: string | null; is_admin: boolean } | null;

function ago(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}天前`;
  return iso.slice(0, 10);
}

function CommentBox({
  articleId,
  viewer,
  parentId,
  replyToUserId,
  placeholder = "平等表达，友善交流",
  autoFocus,
  onDone,
}: {
  articleId: number;
  viewer: Viewer;
  parentId?: number;
  replyToUserId?: number;
  placeholder?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!viewer) {
    return (
      <div className="comment-login">
        <Link href={`/login?next=${encodeURIComponent(typeof location !== "undefined" ? location.pathname : "/")}`} className="btn-primary">
          登录
        </Link>
        <span className="muted">后参与评论</span>
      </div>
    );
  }
  const submit = () =>
    start(async () => {
      setError("");
      const r = await addComment({ articleId, content: text, parentId, replyToUserId });
      if (!r.ok) {
        if (r.login) router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
        setError(r.error);
        return;
      }
      setText("");
      onDone?.();
      router.refresh();
    });
  return (
    <div className="comment-box">
      {!parentId && <Avatar user={viewer} size={40} />}
      <div className="comment-box-main">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          maxLength={1000}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && text.trim()) submit();
          }}
        />
        <div className="comment-box-foot">
          {error && <span className="form-error-inline">{error}</span>}
          <span className="muted hide-sm">Ctrl + Enter 发送</span>
          <span className="muted">{text.length}/1000</span>
          <button className="btn-primary" onClick={submit} disabled={pending || !text.trim()}>
            {pending ? "发送中…" : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Comment({ c, articleId, authorId, viewer, rootId }: { c: CommentItem; articleId: number; authorId: number; viewer: Viewer; rootId?: number }) {
  const [replying, setReplying] = useState(false);
  const [liked, setLiked] = useState(c.liked);
  const [likes, setLikes] = useState(c.likes);
  const [, start] = useTransition();
  const router = useRouter();
  const canDelete = viewer && (viewer.id === c.user.id || viewer.id === authorId || viewer.is_admin);

  const like = () =>
    start(async () => {
      const next = !liked;
      setLiked(next);
      setLikes((n) => n + (next ? 1 : -1));
      const r = await toggleCommentLike(c.id, next);
      if (!r.ok) {
        setLiked(!next);
        setLikes((n) => n - (next ? 1 : -1));
        if (r.login) router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
      }
    });
  const remove = () =>
    start(async () => {
      if (!confirm("确定删除这条评论吗？")) return;
      const r = await deleteComment(c.id);
      if (r.ok) router.refresh();
      else alert(r.error);
    });

  return (
    <div className={`comment ${rootId ? "reply" : ""}`} id={`comment-${c.id}`}>
      <Link href={`/user/${c.user.username}`}>
        <Avatar user={c.user} size={rootId ? 28 : 40} />
      </Link>
      <div className="comment-main">
        <div className="comment-head">
          <Link href={`/user/${c.user.username}`} className="comment-user">
            {c.user.display_name}
          </Link>
          {c.user.id === authorId && <span className="author-badge">作者</span>}
          {c.user.title && <span className="muted hide-sm">{c.user.title}</span>}
          {c.replyTo && rootId && (
            <>
              <span className="muted">回复</span>
              <Link href={`/user/${c.replyTo.username}`} className="comment-user">
                {c.replyTo.display_name}
              </Link>
            </>
          )}
          <span className="muted comment-time">{ago(c.date)}</span>
        </div>
        <div className="comment-content">{c.content}</div>
        <div className="comment-actions">
          <button className={liked ? "active" : ""} onClick={like}>
            👍 {likes > 0 ? likes : "点赞"}
          </button>
          <button onClick={() => (viewer ? setReplying(!replying) : router.push(`/login?next=${encodeURIComponent(location.pathname)}`))}>
            💬 {replying ? "取消回复" : "回复"}
          </button>
          {canDelete && (
            <button className="danger" onClick={remove}>
              删除
            </button>
          )}
        </div>
        {replying && (
          <CommentBox
            articleId={articleId}
            viewer={viewer}
            parentId={c.id}
            replyToUserId={c.user.id}
            placeholder={`回复 ${c.user.display_name}…`}
            autoFocus
            onDone={() => setReplying(false)}
          />
        )}
        {c.replies.length > 0 && (
          <div className="replies">
            {c.replies.map((r) => (
              <Comment key={r.id} c={r} articleId={articleId} authorId={authorId} viewer={viewer} rootId={c.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({
  articleId,
  authorId,
  comments,
  total,
  viewer,
}: {
  articleId: number;
  authorId: number;
  comments: CommentItem[];
  total: number;
  viewer: Viewer;
}) {
  return (
    <section id="comments" className="card comments">
      <h3 className="comments-title">评论 {total > 0 && <span className="muted">{total}</span>}</h3>
      <CommentBox articleId={articleId} viewer={viewer} />
      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="empty">暂无评论，快来抢沙发吧～</p>
        ) : (
          comments.map((c) => <Comment key={c.id} c={c} articleId={articleId} authorId={authorId} viewer={viewer} />)
        )}
      </div>
    </section>
  );
}
