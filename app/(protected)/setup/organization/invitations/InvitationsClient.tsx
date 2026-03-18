"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptOrgInvitation, declineOrgInvitation } from "@/lib/actions/organization";
import { getOrgImageUrl } from "@/lib/image-url-utils";

interface Invitation {
    id: string;
    organization: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
    };
    role: string;
}

interface InvitationsClientProps {
    readonly initialInvitations: Invitation[];
}

export function InvitationsClient({ initialInvitations }: InvitationsClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [invitations, setInvitations] = useState(initialInvitations);
    const [processingId, setProcessingId] = useState<string | null>(null);

    async function handleAccept(id: string) {
        setProcessingId(id);
        startTransition(async () => {
            const result = await acceptOrgInvitation(id);
            if (result.success) {
                toast.success("Invitation accepted! Welcome aboard.");
                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(result.error ?? "Failed to accept invitation");
                setProcessingId(null);
            }
        });
    }

    async function handleDecline(id: string) {
        setProcessingId(id);
        startTransition(async () => {
            const result = await declineOrgInvitation(id);
            if (result.success) {
                toast.success("Invitation declined.");
                setInvitations((prev) => prev.filter((inv) => inv.id !== id));
                setProcessingId(null);
                // If no more invitations, redirect to create org
                if (invitations.length <= 1) {
                    router.push("/setup/organization/new");
                }
                router.refresh();
            } else {
                toast.error(result.error ?? "Failed to decline invitation");
                setProcessingId(null);
            }
        });
    }

    if (invitations.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                    No pending invitations.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {invitations.map((invitation) => {
                const invitationLogoUrl = getOrgImageUrl(invitation.organization.logoUrl);

                return (
                    <Card key={invitation.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary overflow-hidden">
                                {invitationLogoUrl ? (
                                    <Image
                                        src={invitationLogoUrl}
                                        alt={invitation.organization.name}
                                        fill
                                        sizes="48px"
                                        className="object-cover rounded-lg"
                                        unoptimized
                                    />
                                ) : (
                                    <Building2 className="h-6 w-6" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate">
                                    {invitation.organization.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Role: <span className="capitalize">{invitation.role}</span>
                                </p>
                            </div>
                        </CardHeader>
                        <CardFooter className="bg-muted/30 pt-4 flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => handleAccept(invitation.id)}
                                disabled={isPending && processingId === invitation.id}
                            >
                                {isPending && processingId === invitation.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Accept
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleDecline(invitation.id)}
                                disabled={isPending && processingId === invitation.id}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Decline
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    );
}
