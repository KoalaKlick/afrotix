import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProfileById } from "@/lib/dal/profile";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

export default async function OnboardingPage() {
    // Parent layout guarantees user exists and routing is correct
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const profile = await getProfileById(user.id);
    const initialStep = profile?.onboardingCompleted ? 3 : (profile?.onboardingStep ?? 0);

    return <OnboardingClient initialStep={initialStep} />;
}