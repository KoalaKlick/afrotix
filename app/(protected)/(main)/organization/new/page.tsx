import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserOrganizations } from "@/lib/dal/organization";
import { OrgCreationClient } from "./OrgCreationClient";

export default async function NewOrganizationPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Check if this is initial setup (user has no organizations)
    const organizations = await getUserOrganizations(user.id);
    const isInitialSetup = organizations.length === 0;

    return <OrgCreationClient isInitialSetup={isInitialSetup} />;
}
