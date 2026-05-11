import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./workspace";
import { LandingPage } from "./landing";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <DashboardClient
        email={user.email ?? "signed in"}
        avatarUrl={typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined}
        displayName={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined}
      />
    );
  }

  return <LandingPage />;
}

async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
