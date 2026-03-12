"use client"

import { ChevronsUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

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

export type Organization = {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    role: OrganizationRole
    memberCount?: number
}

type OrganizationSwitcherProps = {
    organizations: Organization[]
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
    const [, startTransition] = useTransition()

    // Find active organization or default to "Personal" mode
    const activeOrg = activeOrganizationId
        ? organizations.find((org) => org.id === activeOrganizationId)
        : null

    const handleOrgSelect = (org: Organization | null) => {
        if (org) {
            // Store active org in localStorage for persistence
            localStorage.setItem("activeOrganizationId", org.id)
            onOrganizationChange?.(org.id)

            // Set the server-side cookie via server action
            startTransition(async () => {
                const result = await switchOrganization(org.id)
                if (result.success) {
                    router.push(`/promoter/${org.slug}`)
                }
            })
        } else {
            // Personal mode - no organization
            localStorage.removeItem("activeOrganizationId")
            onOrganizationChange?.(null)
            router.push("/dashboard")
        }
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            {activeOrg ? (
                                <>
                                    <Avatar className="size-8 rounded-lg">
                                        <AvatarImage src={getOrgImageUrl(activeOrg.logoUrl) ?? undefined} alt={activeOrg.name} />
                                        <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                                            {getInitials(activeOrg.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{activeOrg.name}</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {getRoleLabel(activeOrg.role)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <AfroTixLogo className="size-5" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">AfroTix</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            Personal Account
                                        </span>
                                    </div>
                                </>
                            )}
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        {/* Personal account option */}
                        <DropdownMenuItem
                            onClick={() => handleOrgSelect(null)}
                            className="gap-2 p-2"
                        >
                            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <AfroTixLogo className="size-3.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">Personal Account</span>
                                <span className="text-xs text-muted-foreground">Your personal dashboard</span>
                            </div>
                        </DropdownMenuItem>

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
                                        <Avatar className="size-6 rounded-md">
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
                        <DropdownMenuItem asChild className="gap-2 p-2 cursor-pointer">
                            <Link href="/organization/new">
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <Plus className="size-4" />
                                </div>
                                <div className="font-medium text-muted-foreground">
                                    Create Organization
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
