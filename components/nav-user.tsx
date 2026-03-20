"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  Inbox,
  Loader2,
  LogOut,
  Plus,
  Settings,
  Wallet,
  X,
} from "lucide-react"

import {
  Avatar as UiAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Avatar as UserAvatar } from "@/components/shared/image/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from "@/components/ui/sheet"
import { CreateOrgDrawer } from "@/components/create-org-drawer"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { OrganizationRole } from "@/lib/generated/prisma"
import { getAvatarUrl, getOrgImageUrl } from "@/lib/image-url-utils"
import { createClient } from "@/utils/supabase/client"
import { switchOrganization, acceptOrgInvitation, declineOrgInvitation } from "@/lib/actions/organization"

type Organization = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  role: OrganizationRole
  memberCount?: number
}

interface Invitation {
  id: string
  organization: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
  }
  role: string
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
  pendingInvitations = [],
}: Readonly<{
  user: {
    name: string
    email: string
    avatar: string
  }
  organizations?: Organization[]
  activeOrganizationId?: string | null
  pendingInvitations?: Invitation[]
}>) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const [invitations, setInvitations] = useState(pendingInvitations)
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null)

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
        globalThis.location.reload()
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

  const handleAcceptInvite = async (id: string) => {
    setProcessingInviteId(id)
    startTransition(async () => {
      const result = await acceptOrgInvitation(id)
      if (result.success) {
        toast.success("Invitation accepted! Welcome aboard.")
        setInvitations((prev) => prev.filter((inv) => inv.id !== id))
        setNotificationOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to accept invitation")
        setProcessingInviteId(null)
      }
    })
  }

  const handleDeclineInvite = async (id: string) => {
    setProcessingInviteId(id)
    startTransition(async () => {
      const result = await declineOrgInvitation(id)
      if (result.success) {
        toast.success("Invitation declined.")
        setInvitations((prev) => prev.filter((inv) => inv.id !== id))
        setProcessingInviteId(null)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to decline invitation")
        setProcessingInviteId(null)
      }
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-md border border-white/8 hover:text-black  hover:bg-black/5 bg-white/5 transition-all duration-200  hover:border-white/12 data-[state=open]:bg-white/10 data-[state=open]:border-white/15"
            >
              <UserAvatar
                src={getAvatarUrl(user.avatar) ?? ""}
                alt={user.name}
                fullName={user.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg ring-1 ring-white/15"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-40" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 md:min-w-60 rounded-lg border-white/10  shadow-md shadow-black/20 "
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar
                  src={getAvatarUrl(user.avatar) ?? ""}
                  alt={user.name}
                  fullName={user.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg ring-1 ring-white/15"
                />
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
                          <UiAvatar className="size-5 rounded-md">
                            <AvatarImage src={getOrgImageUrl(org.logoUrl) ?? undefined} alt={org.name} />
                            <AvatarFallback className="rounded-md text-[8px] font-semibold">
                              {getInitials(org.name)}
                            </AvatarFallback>
                          </UiAvatar>
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
                  <DropdownMenuItem
                    onClick={() => setCreateOrgOpen(true)}
                    className="gap-2 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    Create Organization
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
                  <Wallet className="mr-2 size-4" />
                  Wallet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setNotificationOpen(true)}
                className="relative cursor-pointer"
              >
                <Bell className="mr-2 size-4" />
                Notifications
                {invitations.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                  >
                    {invitations.length > 9 ? "9+" : invitations.length}
                  </Badge>
                )}
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

      {/* Notifications Sheet */}
      <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </SheetTitle>
            <SheetDescription>
              Organization invitations and updates
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="">
            {invitations.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Pending Invitations
                </h3>
                {invitations.map((invitation) => {
                  const invitationLogoUrl = getOrgImageUrl(invitation.organization.logoUrl)

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
                          <CardTitle className="text-base truncate">
                            {invitation.organization.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Role: <span className="capitalize">{invitation.role}</span>
                          </p>
                        </div>
                      </CardHeader>
                      <CardFooter className="bg-muted/30 pt-4 flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcceptInvite(invitation.id)}
                          disabled={isPending && processingInviteId === invitation.id}
                        >
                          {isPending && processingInviteId === invitation.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDeclineInvite(invitation.id)}
                          disabled={isPending && processingInviteId === invitation.id}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">All caught up!</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  You have no pending notifications or invitations.
                </p>
              </div>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Create Organization Drawer */}
      <CreateOrgDrawer open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
    </SidebarMenu>
  )
}
