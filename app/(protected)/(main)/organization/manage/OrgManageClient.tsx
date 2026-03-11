"use client";

import { Settings, Users, UserPlus, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { OrgGeneralSettings } from "@/components/organization/management/OrgGeneralSettings";
import { OrgMembersSettings } from "@/components/organization/management/OrgMembersSettings";
import { OrgJoinRequestsSettings } from "@/components/organization/management/OrgJoinRequestsSettings";
import type { Organization, OrganizationRole } from "@/lib/generated/prisma";

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

interface OrgManageClientProps {
    readonly organization: Organization;
    readonly members: Member[];
    readonly joinRequests: JoinRequest[];
    readonly currentUserId: string;
}

export function OrgManageClient({
    organization,
    members,
    joinRequests,
    currentUserId,
}: OrgManageClientProps) {
    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                <Settings className="inline mr-1.5 h-3.5 w-3.5" />
                                Manage Organization
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            {organization.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your organization settings, members, and join requests.
                        </p>
                    </div>

                    <Tabs defaultValue="general" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
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
                    </Tabs>
                </div>
            </div>
        </>
    );
}
