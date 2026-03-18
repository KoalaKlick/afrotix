"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Mail, X, Clock, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import { cancelInvitation } from "@/lib/actions/organization";
import type { InvitationStatus, OrganizationRole } from "@/lib/generated/prisma";
import { OrgDataTable, type Column } from "./OrgDataTable";

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

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
    owner: "default",
    admin: "secondary",
    member: "outline",
};

function getEffectiveStatus(status: InvitationStatus, expiresAt: Date | null): string {
    if (status === "pending" && expiresAt && new Date(expiresAt) < new Date()) {
        return "expired";
    }
    return status;
}

function getStatusBadge(status: InvitationStatus, expiresAt: Date | null) {
    const effective = getEffectiveStatus(status, expiresAt);

    if (effective === "accepted") {
        return (
            <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Accepted
            </Badge>
        );
    }
    if (effective === "declined") {
        return (
            <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                <XCircle className="h-3 w-3 mr-1" />
                Declined
            </Badge>
        );
    }
    if (effective === "expired") {
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

    const pendingCount = invitations.filter(
        (inv) => getEffectiveStatus(inv.status, inv.expiresAt) === "pending"
    ).length;

    const columns: Column<SentInvitation>[] = [
        {
            header: "Invitee",
            cell: (inv) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                            {inv.email[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium text-sm truncate">{inv.email}</p>
                        {inv.inviter && (
                            <p className="text-xs text-muted-foreground">
                                Invited by {inv.inviter.fullName ?? "Unknown"}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: "Role",
            cell: (inv) => (
                <Badge variant={roleBadgeVariant[inv.role] ?? "outline"}>
                    {inv.role}
                </Badge>
            ),
        },
        {
            header: "Status",
            cell: (inv) => getStatusBadge(inv.status, inv.expiresAt),
        },
        {
            header: "Date",
            cell: (inv) => (
                <span className="text-sm text-muted-foreground">
                    {inv.respondedAt
                        ? new Date(inv.respondedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })
                        : new Date(inv.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })
                    }
                </span>
            ),
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (inv) => {
                const effective = getEffectiveStatus(inv.status, inv.expiresAt);
                if (effective !== "pending") return null;
                return (
                    <div className="flex items-center justify-end">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleCancel(inv.id)}
                            disabled={isPending}
                            title="Cancel Invitation"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                    </div>
                );
            },
        },
    ];

    const title = pendingCount > 0
        ? `Sent Invitations (${pendingCount} pending)`
        : "Sent Invitations";

    return (
        <OrgDataTable
            icon={<Mail className="h-5 w-5" />}
            title={title}
            columns={columns}
            data={invitations}
            keyExtractor={(inv) => inv.id}
            emptyState={
                <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No invitations sent</p>
                    <p className="text-sm mt-1">Invite team members from the Members tab.</p>
                </div>
            }
        />
    );
}
