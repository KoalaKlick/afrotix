import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getPendingInvitationsForEmail } from "@/lib/dal/organization";
import { InvitationsClient } from "./InvitationsClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function InvitationsPage() {
    // Parent layout guarantees user exists and has pending invitations
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const invitations = await getPendingInvitationsForEmail(user.email ?? "");

    // If no invitations, redirect to creation flow
    if (invitations.length === 0) {
        redirect("/setup/organization/new");
    }

    return (
        <div className="w-full max-w-md space-y-6 px-4">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Organization Invitations</h1>
                <p className="text-muted-foreground">
                    You've been invited to join the following organizations.
                </p>
            </div>

            <InvitationsClient initialInvitations={invitations} />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or start fresh
                    </span>
                </div>
            </div>

            <Card className="border-dashed">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">Create New Organization</CardTitle>
                    <CardDescription>
                        Set up your own brand and start hosting events.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/setup/organization/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Organization
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
