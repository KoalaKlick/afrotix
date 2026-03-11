import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProfileById } from "@/lib/dal/profile";
import { OnboardingClient } from "./OnboardingClient";
import { TOTAL_ONBOARDING_STEPS } from "@/lib/validations/profile";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Fetch profile to get current onboarding step
    const profile = await getProfileById(user.id);

    // If onboarding is already complete, redirect to dashboard
    if (profile?.onboardingCompleted) {
        redirect("/dashboard");
    }

    const initialStep = profile?.onboardingStep ?? 0;
    const userName = profile?.fullName ?? user.user_metadata?.full_name ?? "";

    return (
        <OnboardingClient
            initialStep={initialStep}
            userName={userName}
            totalSteps={TOTAL_ONBOARDING_STEPS}
        />
    );
}
