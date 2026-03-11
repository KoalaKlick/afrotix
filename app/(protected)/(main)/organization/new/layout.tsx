import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AfroTixLogo } from "@/components/shared/AfroTixLogo";
import { getUserOrganizations } from "@/lib/dal/organization";
import { createClient } from "@/utils/supabase/server";

export default async function NewOrganizationLayout({
    children,
}: {
    readonly children: ReactNode;
}) {
    // Check if this is initial setup (user has no organizations)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const organizations = user ? await getUserOrganizations(user.id) : [];
    const isInitialSetup = organizations.length === 0;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    {isInitialSetup ? (
                        <div className="flex items-center gap-2">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <AfroTixLogo className="size-5" />
                            </div>
                            <span className="font-semibold">AfroTix</span>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center py-10">
                {children}
            </main>
        </div>
    );
}
