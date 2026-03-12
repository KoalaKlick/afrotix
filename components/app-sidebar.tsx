"use client"

import type * as React from "react"
import {
  Building2,
  Calendar,
  Heart,
  Home,
  QrCode,
  Search,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { AfroTixLogo } from "@/components/shared/AfroTixLogo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { OrganizationRole, Organization } from "@/lib/generated/prisma"
import { navMain, type OrganizationInfo } from "@/lib/const/navigation"

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

export function AppSidebar({
  user,
  organizations = [],
  activeOrganization,
  pendingInvitations = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string
    email: string
    avatar: string
  }
  organizations?: OrganizationInfo[]
  activeOrganization?: Organization | null
  pendingInvitations?: Invitation[]
}) {
  const defaultUser = {
    name: "User",
    email: "",
    avatar: "",
  }
  const sidebarUser = user ?? defaultUser

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">

                  <AfroTixLogo className="size-5" />

                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {"AfroTix"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeOrganization ? `@${activeOrganization.slug}` : "Events Platform"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={sidebarUser}
          organizations={organizations}
          activeOrganizationId={activeOrganization?.id}
          pendingInvitations={pendingInvitations}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
