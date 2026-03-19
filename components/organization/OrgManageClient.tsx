"use client";

import { Settings, Users, UserPlus, Building2, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { OrgGeneralSettings } from "@/components/organization/management/OrgGeneralSettings";
import { OrgMembersSettings } from "@/components/organization/management/OrgMembersSettings";
import { OrgJoinRequestsSettings } from "@/components/organization/management/OrgJoinRequestsSettings";
import { OrgInvitationsSettings } from "@/components/organization/management/OrgInvitationsSettings";
import type { Organization, OrganizationRole, InvitationStatus } from "@/lib/generated/prisma";

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

interface JoinRequest {
    id: string;
    organizationId: string;
    userId: string;
    message: string | null;
    createdAt: Date;
    user: {
        id: string;
        fullName: string | null;
        email: string;
        avatarUrl: string | null;
    };
}

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

interface OrgManageClientProps {
    readonly organization: Organization;
    readonly members: Member[];
    readonly joinRequests: JoinRequest[];
    readonly invitations: SentInvitation[];
    readonly currentUserId: string;
}

export function OrgManageClient({
    organization,
    members,
    joinRequests,
    invitations,
    currentUserId,
}: OrgManageClientProps) {
    return (
        <>
            <PageHeader
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    {
                        label: (
                            <>
                                <Settings className="inline text-secondary-500 mr-1.5 h-3.5 w-3.5" />
                                <span>Manage Organization</span>
                            </>
                        ),
                    },
                ]}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto ">
                <div className=" mx-auto p-6 pt-0 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            {organization.name}
                        </h1>
                        <p className=" mt-1 text-sm font-poppins">
                            Manage your organization settings, members, and join requests.
                        </p>
                    </div>

                    <Tabs defaultValue="general" className="space-y-6">
                        <TabsList variant="afro" className="grid w-full grid-cols-4">
                            <TabsTrigger value="general" className="gap-1.5">
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">General</span>
                            </TabsTrigger>
                            <TabsTrigger value="members" className="gap-1.5">
                                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline">Members</span>
                            </TabsTrigger>
                            <TabsTrigger value="requests" className="gap-1.5 relative">
                                <UserPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">Requests</span>
                                {joinRequests.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                                        {joinRequests.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="invitations" className="gap-1.5 relative">
                                <Mail className="h-4 w-4" />
                                <span className="hidden sm:inline">Invitations</span>
                                {invitations.filter(i => i.status === "pending").length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-tertiary-600 text-white text-[10px] font-bold">
                                        {invitations.filter(i => i.status === "pending").length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <OrgGeneralSettings organization={organization} />
                        </TabsContent>

                        <TabsContent value="members">
                            <OrgMembersSettings
                                organizationId={organization.id}
                                members={members}
                                currentUserId={currentUserId}
                            />
                        </TabsContent>

                        <TabsContent value="requests">
                            <OrgJoinRequestsSettings
                                organizationId={organization.id}
                                requests={joinRequests}
                            />
                        </TabsContent>

                        <TabsContent value="invitations">
                            <OrgInvitationsSettings
                                organizationId={organization.id}
                                invitations={invitations}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}
