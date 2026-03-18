import { OrgCreationClient } from "./OrgCreationClient";

export default function NewOrganizationPage() {
    // Parent layout guarantees user is authenticated and needs org setup
    return <OrgCreationClient isInitialSetup={true} />;
}
