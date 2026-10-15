import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SettingsForms from "./SettingsForms";

export const metadata = { title: "账号设置", robots: { index: false } };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");
  return (
    <div className="narrow">
      <SettingsForms user={{ username: user.username, displayName: user.display_name, title: user.title, bio: user.bio, avatar: user.avatar ?? "" }} />
    </div>
  );
}
