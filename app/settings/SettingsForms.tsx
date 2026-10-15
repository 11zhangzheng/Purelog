"use client";
import Link from "next/link";
import { useActionState } from "react";
import { changePassword, updateProfile } from "../actions";

type U = { username: string; displayName: string; title: string; bio: string; avatar: string };

export default function SettingsForms({ user }: { user: U }) {
  const [p, profileAction, p1] = useActionState(updateProfile, undefined);
  const [pw, pwAction, p2] = useActionState(changePassword, undefined);
  const v = { ...user, ...p?.values };
  return (
    <>
      <form action={profileAction} className="card page-card settings-form">
        <h1 className="page-title">
          个人资料 <Link href={`/user/${user.username}`} className="link small-link">查看主页 ›</Link>
        </h1>
        <label>
          用户名
          <input value={user.username} disabled />
        </label>
        <label>
          昵称
          <input name="displayName" defaultValue={v.displayName} maxLength={30} required />
        </label>
        <label>
          职位
          <input name="title" defaultValue={v.title} maxLength={30} placeholder="如：前端工程师 @ 某公司" />
        </label>
        <label>
          个人简介
          <textarea name="bio" defaultValue={v.bio} maxLength={200} rows={3} placeholder="介绍一下自己吧" />
        </label>
        <label>
          头像链接
          <input name="avatar" type="url" defaultValue={v.avatar} placeholder="https://…（留空使用默认头像）" />
        </label>
        {p?.error && <p className="form-error">{p.error}</p>}
        {p?.ok && <p className="form-ok">{p.ok}</p>}
        <button className="btn-primary" disabled={p1}>{p1 ? "保存中…" : "保存修改"}</button>
      </form>

      <form action={pwAction} className="card page-card settings-form">
        <h2 className="page-title">修改密码</h2>
        <label>
          原密码
          <input name="oldPassword" type="password" autoComplete="current-password" required />
        </label>
        <label>
          新密码
          <input name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label>
          确认新密码
          <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        {pw?.error && <p className="form-error">{pw.error}</p>}
        {pw?.ok && <p className="form-ok">{pw.ok}</p>}
        <button className="btn-primary" disabled={p2}>{p2 ? "提交中…" : "修改密码"}</button>
      </form>
    </>
  );
}
