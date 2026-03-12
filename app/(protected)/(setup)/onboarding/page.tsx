import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProfileById } from "@/lib/dal/profile";
import { getPendingInvitationsForEmail, getUserOrganizations } from "@/lib/dal/organization";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const profile = await getProfileById(user.id);

    if (profile?.onboardingCompleted) {
        const [organizations, pendingInvitations] = await Promise.all([
            getUserOrganizations(user.id),
            getPendingInvitationsForEmail(user.email ?? ""),
        ]);

        if (organizations.length > 0) {
            redirect("/dashboard");
        }

        if (pendingInvitations.length > 0) {
            redirect("/organization/invitations");
        }

        redirect("/organization/new?setup=true");
    }

    const initialStep = profile?.onboardingStep ?? 0;
    return (
        <OnboardingClient
            initialStep={initialStep}
        />
    );
}