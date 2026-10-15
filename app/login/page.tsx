import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "./AuthForm";

export const metadata = { title: "登录 / 注册", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const { next = "/", mode } = await searchParams;
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await getCurrentUser()) redirect(safe);
  return (
    <div className="auth-wrap">
      <AuthForm next={safe} initialMode={mode === "register" ? "register" : "login"} inviteRequired={Boolean(process.env.REGISTER_INVITE_CODE)} />
    </div>
  );
}
