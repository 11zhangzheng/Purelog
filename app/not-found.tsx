import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card page-card not-found">
      <h1>404</h1>
      <p>页面走丢了～</p>
      <Link href="/" className="btn-primary">返回首页</Link>
    </div>
  );
}
