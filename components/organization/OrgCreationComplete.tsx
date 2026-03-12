/**
 * Organization Creation Complete
 * Success state after creating organization
 */

"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OrgCreationCompleteProps {
    readonly organization: {
        name: string;
        slug: string;
        logoUrl?: string;
    };
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function OrgCreationComplete({ organization }: OrgCreationCompleteProps) {
    const router = useRouter();

    function handleGoToOrganization() {
        router.push("/dashboard");
    }

    function handleCreateEvent() {
        router.push("/my-events/new");
    }

    return (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
            {/* Success Icon */}
            <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 animate-in zoom-in-50 duration-300">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="absolute -top-1 -right-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300">
                    <PartyPopper className="h-6 w-6 text-yellow-500" />
                </div>
            </div>

            {/* Organization Info */}
            <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-150">
                <h2 className="text-2xl font-bold">Organization Created!</h2>
                <p className="text-muted-foreground">
                    Your organization is ready to host amazing events.
                </p>
            </div>

            {/* Organization Card */}
            <div className="w-full max-w-sm p-4 rounded-xl border bg-card animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-xl">
                        <AvatarImage src={organization.logoUrl} alt={organization.name} />
                        <AvatarFallback className="rounded-xl text-lg font-semibold bg-primary/10 text-primary">
                            {getInitials(organization.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                        <h3 className="font-semibold">{organization.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            afrotix.com/{organization.slug}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-500">
                <Button
                    variant="outline"
                    onClick={handleGoToOrganization}
                    className="flex-1"
                >
                    View Dashboard
                </Button>
                <Button onClick={handleCreateEvent} className="flex-1">
                    Create Event
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
