const COLORS = ["#1e80ff", "#ff7d00", "#00b42a", "#f53f3f", "#722ed1", "#14c9c9", "#eb2f96", "#fadb14"];

// 无头像时按用户名生成彩色字母头像
export default function Avatar({ user, size = 32 }: { user: { username: string; display_name: string; avatar?: string | null }; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.45 };
  if (user.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="avatar-img" src={user.avatar} alt={user.display_name} style={style} loading="lazy" />;
  }
  let h = 0;
  for (const ch of user.username) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className="avatar-img avatar-text" style={{ ...style, background: COLORS[h % COLORS.length] }} aria-label={user.display_name}>
      {user.display_name.slice(0, 1).toUpperCase()}
    </span>
  );
}
