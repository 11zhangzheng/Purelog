"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions";

export default function FollowButton({ userId, initial, small }: { userId: number; initial: boolean; small?: boolean }) {
  const [following, setFollowing] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const click = () =>
    start(async () => {
      const next = !following;
      setFollowing(next);
      const r = await toggleFollow(userId, next);
      if (!r.ok) {
        setFollowing(!next);
        if (r.login) router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
        else alert(r.error);
      } else router.refresh();
    });
  return (
    <button className={`follow-btn ${following ? "followed" : ""} ${small ? "small" : ""}`} onClick={click} disabled={pending}>
      {following ? "已关注" : "+ 关注"}
    </button>
  );
}
