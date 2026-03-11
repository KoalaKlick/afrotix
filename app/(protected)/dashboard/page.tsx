import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProfileById } from "@/lib/dal/profile";
import { DashboardContent } from "./DashboardContent";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch profile from database
  const profile = await getProfileById(user.id);

  return (
    <DashboardContent
      user={{
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name ?? profile?.fullName ?? "",
      }}
      profile={profile}
    />
  );
}