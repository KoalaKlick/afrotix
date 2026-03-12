"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Mail, X, Clock, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { cancelInvitation } from "@/lib/actions/organization";
import type { InvitationStatus, OrganizationRole } from "@/lib/generated/prisma";

interface SentInvitation {
    id: string;
    organizationId: string;
    email: string;
    role: OrganizationRole;
    status: InvitationStatus;
    expiresAt: Date | null;
    createdAt: Date;
    respondedAt: Date | null;
    inviter: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
    } | null;
}

interface OrgInvitationsSettingsProps {
    readonly organizationId: string;
    readonly invitations: SentInvitation[];
}

function getInitials(name: string | null): string {
    if (!name) return "??";
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getStatusBadge(status: InvitationStatus, expiresAt: Date | null) {
    const isExpired = expiresAt && new Date(expiresAt) < new Date();

    if (status === "accepted") {
        return (
            <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Accepted
            </Badge>
        );
    }
    if (status === "declined") {
        return (
            <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                <XCircle className="h-3 w-3 mr-1" />
                Declined
            </Badge>
        );
    }
    if (isExpired) {
        return (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                <AlertCircle className="h-3 w-3 mr-1" />
                Expired
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
        </Badge>
    );
}

export function OrgInvitationsSettings({ organizationId, invitations }: OrgInvitationsSettingsProps) {
    const [isPending, startTransition] = useTransition();

    const handleCancel = (invitationId: string) => {
        startTransition(async () => {
            const result = await cancelInvitation(organizationId, invitationId);
            if (result.success) {
                toast.success("Invitation cancelled.");
            } else {
                toast.error(result.error ?? "Failed to cancel invitation.");
            }
        });
    };

    const pendingInvitations = invitations.filter(
        (inv) => inv.status === "pending" && (!inv.expiresAt || new Date(inv.expiresAt) > new Date())
    );
    const otherInvitations = invitations.filter(
        (inv) => inv.status !== "pending" || (inv.expiresAt && new Date(inv.expiresAt) <= new Date())
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Sent Invitations
                    {pendingInvitations.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{pendingInvitations.length} pending</Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {invitations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No invitations sent</p>
                        <p className="text-sm mt-1">Invite team members from the Members tab.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Pending Invitations */}
                        {pendingInvitations.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground">Pending</h4>
                                {pendingInvitations.map((inv) => (
                                    <div
                                        key={inv.id}
                                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{inv.email[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{inv.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs capitalize">
                                                    {inv.role}
                                                </Badge>
                                                {getStatusBadge(inv.status, inv.expiresAt)}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Sent {new Date(inv.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                                {inv.inviter && ` by ${inv.inviter.fullName ?? "Unknown"}`}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive border-destructive/20 hover:bg-destructive/5"
                                            onClick={() => handleCancel(inv.id)}
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Past Invitations */}
                        {otherInvitations.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground">History</h4>
                                {otherInvitations.map((inv) => (
                                    <div
                                        key={inv.id}
                                        className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-muted">{inv.email[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate text-muted-foreground">{inv.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs capitalize">
                                                    {inv.role}
                                                </Badge>
                                                {getStatusBadge(inv.status, inv.expiresAt)}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {inv.respondedAt
                                                    ? `Responded ${new Date(inv.respondedAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}`
                                                    : `Sent ${new Date(inv.createdAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
