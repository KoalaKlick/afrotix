"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Users, Shield, ShieldCheck, UserMinus, Mail, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar } from "@/components/shared/image/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    updateMemberRole,
    removeMember,
    inviteMember,
} from "@/lib/actions/organization";
import type { OrganizationRole } from "@/lib/generated/prisma";
import { getAvatarUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";
import { OrgDataTable, type Column } from "./OrgDataTable";

interface Member {
    id: string;
    role: OrganizationRole;
    joinedAt: Date;
    user: {
        id: string;
        fullName: string | null;
        email: string;
        avatarUrl: string | null;
        username: string | null;
    };
}

interface OrgMembersSettingsProps {
    readonly organizationId: string;
    readonly members: Member[];
    readonly currentUserId: string;
}

export function OrgMembersSettings({ organizationId, members, currentUserId }: OrgMembersSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<OrganizationRole>("member");

    const handleRoleChange = (userId: string, newRole: OrganizationRole) => {
        startTransition(async () => {
            const result = await updateMemberRole(organizationId, userId, newRole);
            if (result.success) {
                toast.success("Role updated successfully!");
            } else {
                toast.error(result.error ?? "Failed to update role.");
            }
        });
    };

    const handleRemove = (userId: string, name: string | null) => {
        if (!confirm(`Are you sure you want to remove ${name ?? "this member"}?`)) return;
        startTransition(async () => {
            const result = await removeMember(organizationId, userId);
            if (result.success) {
                toast.success("Member removed.");
            } else {
                toast.error(result.error ?? "Failed to remove member.");
            }
        });
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        startTransition(async () => {
            const result = await inviteMember(organizationId, inviteEmail.trim(), inviteRole);
            if (result.success) {
                toast.success(`Invitation sent to ${inviteEmail}!`);
                setInviteEmail("");
                setInviteOpen(false);
            } else {
                toast.error(result.error ?? "Failed to send invitation.");
            }
        });
    };

    const columns: Column<Member>[] = [
        {
            header: "Member",
            cell: (member) => {
                const isSelf = member.user.id === currentUserId;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={getAvatarUrl(member.user.avatarUrl) ?? ""}
                            alt={member.user.fullName ?? member.user.username ?? "Member"}
                            fullName={member.user.fullName}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-md"
                        />
                        <div>
                            <p className="font-medium text-sm">
                                {member.user.fullName ?? member.user.username ?? "Unknown"}
                                {isSelf && <span className="text-muted-foreground ml-1">(You)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.user.email}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            header: "Role",
            cell: (member) => (
                <StatusBadge variant={member.role} />
            ),
        },
        {
            header: "Joined",
            cell: (member) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(member.joinedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </span>
            ),
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (member) => {
                const isOwner = member.role === "owner";
                const isSelf = member.user.id === currentUserId;
                if (isOwner || isSelf) return null;
                return (
                    <div className="flex items-center justify-end gap-1">
                        {member.role === "member" ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRoleChange(member.user.id, "admin")}
                                disabled={isPending}
                                title="Promote to Admin"
                            >
                                <ShieldCheck className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRoleChange(member.user.id, "member")}
                                disabled={isPending}
                                title="Demote to Member"
                            >
                                <Shield className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemove(member.user.id, member.user.fullName)}
                            disabled={isPending}
                            title="Remove Member"
                        >
                            <UserMinus className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <OrgDataTable
            icon={<Users className="h-5 w-5" />}
            title={`Members (${members.length})`}
            columns={columns}
            data={members}
            keyExtractor={(m) => m.id}
            headerAction={
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="tertiary">
                            <Plus className="mr-1 h-4 w-4" /> Invite
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite a Member</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <Label htmlFor="invite-email">Email Address</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setInviteRole("member")}
                                        className={cn(
                                            "rounded-md border px-3 py-1.5 transition-all",
                                            inviteRole === "member"
                                                ? "ring-2 ring-primary ring-offset-1"
                                                : "opacity-50 hover:opacity-80"
                                        )}
                                    >
                                        <StatusBadge variant="member" size="sm" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInviteRole("admin")}
                                        className={cn(
                                            "rounded-md border px-3 py-1.5 transition-all",
                                            inviteRole === "admin"
                                                ? "ring-2 ring-primary ring-offset-1"
                                                : "opacity-50 hover:opacity-80"
                                        )}
                                    >
                                        <StatusBadge variant="admin" size="sm" />
                                    </button>
                                </div>
                        </div>
                        <Button type="submit" variant="tertiary" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                            ) : (
                                <><Mail className="mr-2 h-4 w-4" /> Send Invitation</>
                            )}
                        </Button>
                    </form>
                </DialogContent>
                </ Dialog>
            }
        />
            );
}
