"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import {
  BadgeCheck,
  Bell,
  Building2,
  ChevronsUpDown,
  CreditCard,
  Loader2,
  LogOut,
  Plus,
  Settings,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { OrganizationRole } from "@/lib/generated/prisma"
import { createClient } from "@/utils/supabase/client"
import { switchOrganization } from "@/lib/actions/organization"

type Organization = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  role: OrganizationRole
  memberCount?: number
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

export function NavUser({
  user,
  organizations = [],
  activeOrganizationId,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  organizations?: Organization[]
  activeOrganizationId?: string | null
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const activeOrg = activeOrganizationId
    ? organizations.find((org) => org.id === activeOrganizationId)
    : null

  const handleOrgSelect = async (org: Organization) => {
    console.log("[NavUser] handleOrgSelect called for:", org.name, org.id)
    console.log("[NavUser] Current activeOrganizationId:", activeOrganizationId)
    
    if (org.id === activeOrganizationId) {
      console.log("[NavUser] Already active, skipping")
      return // Already active
    }

    startTransition(async () => {
      console.log("[NavUser] Calling switchOrganization...")
      const result = await switchOrganization(org.id)
      console.log("[NavUser] switchOrganization result:", result)
      if (result.success) {
        console.log("[NavUser] Success! Reloading...")
        // Force a hard refresh to update all server components
        window.location.reload()
      } else {
        console.error("[NavUser] Switch failed:", result.error)
      }
    })
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
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
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Organizations Submenu */}
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Building2 className="mr-2 size-4" />
                  <span>Organizations</span>
                  {activeOrg && (
                    <span className="ml-auto text-xs text-muted-foreground truncate max-w-20">
                      {activeOrg.name}
                    </span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="min-w-52">
                  {organizations.length > 0 ? (
                    <>
                      {organizations.map((org) => (
                        <DropdownMenuItem
                          key={org.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOrgSelect(org)
                          }}
                          className="gap-2 cursor-pointer"
                          disabled={isPending}
                        >
                          <Avatar className="size-5 rounded-md">
                            <AvatarImage src={org.logoUrl ?? undefined} alt={org.name} />
                            <AvatarFallback className="rounded-md text-[8px] font-semibold">
                              {getInitials(org.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate">{org.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {getRoleLabel(org.role)}
                            </span>
                          </div>
                          {activeOrganizationId === org.id && (
                            <span className="text-xs text-primary flex items-center gap-1">
                              {isPending ? <Loader2 className="size-3 animate-spin" /> : "Active"}
                            </span>
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No organizations yet
                    </div>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/organization/new" className="gap-2">
                      <Plus className="size-4" />
                      Create Organization
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">
                  <BadgeCheck className="mr-2 size-4" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/wallet">
                  <CreditCard className="mr-2 size-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/notifications">
                  <Bell className="mr-2 size-4" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
