import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OrgCreationClient } from "./OrgCreationClient";

export default async function NewOrganizationPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // This is always initial setup since this route is in (setup) group
    return <OrgCreationClient isInitialSetup={true} />;
}
