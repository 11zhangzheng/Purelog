"use client";
import { useActionState, useState } from "react";
import { login, register } from "../actions";

type Mode = "login" | "register";

function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <label>
        用户名
        <input name="username" autoComplete="username" required defaultValue={state?.values?.username} />
      </label>
      <label>
        密码
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error && <p className="form-error">{state.error}</p>}
      <button className="btn-primary btn-block" disabled={pending}>
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}

function RegisterForm({ next, inviteRequired }: { next: string; inviteRequired: boolean }) {
  const [state, action, pending] = useActionState(register, undefined);
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <label>
        用户名
        <input name="username" autoComplete="username" required pattern="[A-Za-z0-9_]{3,20}" title="3-20 位字母、数字或下划线" defaultValue={state?.values?.username} />
      </label>
      <label>
        昵称 <span className="muted">（选填，展示在文章中）</span>
        <input name="displayName" maxLength={30} defaultValue={state?.values?.displayName} />
      </label>
      <label>
        密码
        <input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </label>
      <label>
        确认密码
        <input name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </label>
      {inviteRequired && (
        <label>
          邀请码
          <input name="invite" required />
        </label>
      )}
      {state?.error && <p className="form-error">{state.error}</p>}
      <button className="btn-primary btn-block" disabled={pending}>
        {pending ? "注册中…" : "注册并登录"}
      </button>
    </form>
  );
}

export default function AuthForm({ next, initialMode, inviteRequired }: { next: string; initialMode: Mode; inviteRequired: boolean }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  return (
    <div className="card auth-card">
      <h1>{mode === "login" ? "登录 Purelog" : "注册 Purelog"}</h1>
      <p className="muted">登录后即可发表文章</p>
      <div className="auth-tabs">
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
          登录
        </button>
        <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
          注册
        </button>
      </div>
      {mode === "login" ? <LoginForm next={next} /> : <RegisterForm next={next} inviteRequired={inviteRequired} />}
    </div>
  );
}
