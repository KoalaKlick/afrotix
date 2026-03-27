"use client"
import { useState } from "react"

import { ChevronsUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AfroTixLogo } from "@/components/shared/AfroTixLogo"
import { switchOrganization } from "@/lib/actions/organization"
import type { OrganizationRole } from "@/lib/generated/prisma"
import { getOrgImageUrl } from "@/lib/image-url-utils"
import { type OrganizationInfo } from "@/lib/const/navigation"
import { CreateOrgDrawer } from "./create-org-drawer"
import { PROJ_NAME } from "@/lib/const/branding"

export type Organization = {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    role: OrganizationRole
    memberCount?: number
}

type OrganizationSwitcherProps = {
    organizations: OrganizationInfo[]
    activeOrganizationId?: string | null
    onOrganizationChange?: (orgId: string | null) => void
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

function getRoleLabel(role: OrganizationRole): string {
    switch (role) {
        case "owner":
            return "Owner"
        case "admin":
            return "Admin"
        case "member":
            return "Member"
        default:
            return "Member"
    }
}

export function OrganizationSwitcher({
    organizations,
    activeOrganizationId,
    onOrganizationChange,
}: Readonly<OrganizationSwitcherProps>) {
    const { isMobile } = useSidebar()
    const router = useRouter()
    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
    const [, startTransition] = useTransition()

    // Find active organization or default to "Personal" mode
    const activeOrg = activeOrganizationId
        ? organizations.find((org) => org.id === activeOrganizationId)
        : null

    const handleOrgSelect = (org: OrganizationInfo | null) => {
        if (org) {
            if (org.id === activeOrganizationId) return

            // Set the server-side cookie via server action
            startTransition(async () => {
                const result = await switchOrganization(org.id)
                if (result.success) {
                    // Force a hard refresh to update all server components
                    globalThis.location.reload()
                } else {
                    toast.error(result.error ?? "Failed to switch organization")
                }
            })
        } else {
            // Personal mode - no organization
            startTransition(async () => {
                // If there's a switchOrganization equivalent for personal mode, use it.
                // Otherwise, we might need a separate action or just redirect.
                // Assuming switchOrganization(null) might work or we just go to dashboard.
                // Looking at nav-user.tsx, it doesn't seem to have a "Personal" switch action,
                // it just switches to other orgs.
                router.push("/dashboard")
                onOrganizationChange?.(null)
            })
        }
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="xl"
                            className="rounded-md  py-3 border-black/10 bg-[radial-gradient(circle_at_top_left,rgba(147,30,21,0.26),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.0),transparent_26%)] hover:bg-black/5 transition-colors outline-none focus:outline-none focus:ring-0 focus-within:outline-none focus-within:ring-0 duration-300 px-3 backdrop-blur-sm data-[state=open]:bg-black/5"
                        >
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <AfroTixLogo className="h-6" />
                                <span className="truncate text-xs text-black/70">
                                    {activeOrg ? `@${activeOrg.slug}` : `${PROJ_NAME} Platform`}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        {/* Dynamic Current Context (Active Org or Personal Account) */}
                        <DropdownMenuItem
                            onClick={() => handleOrgSelect(activeOrg ?? null)}
                            className="gap-2 p-2"
                        >
                            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                {activeOrg ? (
                                    <Avatar className="size-8 rounded-md">
                                        <AvatarImage src={getOrgImageUrl(activeOrg.logoUrl) ?? undefined} alt={activeOrg.name} />
                                        <AvatarFallback className="rounded-md text-[10px] font-semibold">
                                            {getInitials(activeOrg.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <AfroTixLogo className="size-3.5" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">
                                    {activeOrg ? activeOrg.name : "Personal Account"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {activeOrg ? `@${activeOrg.slug}` : `Your personal ${PROJ_NAME} dashboard`}
                                </span>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Back into personal mode if currently in an organization */}
                        {activeOrg && (
                            <DropdownMenuItem
                                onClick={() => handleOrgSelect(null)}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <AfroTixLogo className="size-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">Personal Account</span>
                                    <span className="text-xs text-muted-foreground">Switch back to personal dashboard</span>
                                </div>
                            </DropdownMenuItem>
                        )}

                        {organizations.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    Organizations
                                </DropdownMenuLabel>
                                {organizations.map((org) => (
                                    <DropdownMenuItem
                                        key={org.id}
                                        onClick={() => handleOrgSelect(org)}
                                        className="gap-2 p-2"
                                    >
                                        <Avatar className="size-8 rounded-md">
                                            <AvatarImage src={getOrgImageUrl(org.logoUrl) ?? undefined} alt={org.name} />
                                            <AvatarFallback className="rounded-md text-[10px] font-semibold">
                                                {getInitials(org.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium truncate">{org.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {getRoleLabel(org.role)}
                                                {org.memberCount && ` · ${org.memberCount} members`}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2 p-2 cursor-pointer"
                            onClick={() => setIsCreateOrgOpen(true)}
                        >
                            <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                <Plus className="size-4" />
                            </div>
                            <div className="font-medium text-muted-foreground">
                                Create Organization
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            <CreateOrgDrawer
                open={isCreateOrgOpen}
                onOpenChange={setIsCreateOrgOpen}
            />
        </SidebarMenu>
    )
}
