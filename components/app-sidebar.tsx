"use client"

import type * as React from "react"
import {
  Calendar,
  Heart,
  Home,
  QrCode,
  Search,
  Settings2,
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
  SidebarRail,
} from "@/components/ui/sidebar"
import type { OrganizationRole, Organization } from "@/lib/generated/prisma"

// Organization type for switcher
export type OrganizationInfo = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  role: OrganizationRole
  memberCount?: number
}

// AfroTix navigation data
const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    isActive: true,
  },
  {
    title: "Discover Events",
    url: "/events",
    icon: Search,
    items: [
      {
        title: "All Events",
        url: "/events",
      },
      {
        title: "Near Me",
        url: "/events/nearby",
      },
      {
        title: "This Weekend",
        url: "/events/weekend",
      },
    ],
  },
  {
    title: "My Tickets",
    url: "/tickets",
    icon: Ticket,
    items: [
      {
        title: "Upcoming",
        url: "/tickets/upcoming",
      },
      {
        title: "Past Events",
        url: "/tickets/past",
      },
      {
        title: "Transfers",
        url: "/tickets/transfers",
      },
    ],
  },
  {
    title: "Saved",
    url: "/saved",
    icon: Heart,
  },
  {
    title: "Wallet",
    url: "/wallet",
    icon: Wallet,
    items: [
      {
        title: "Balance",
        url: "/wallet",
      },
      {
        title: "Transactions",
        url: "/wallet/transactions",
      },
      {
        title: "Referrals",
        url: "/wallet/referrals",
      },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
    items: [
      {
        title: "Profile",
        url: "/settings/profile",
      },
      {
        title: "Notifications",
        url: "/settings/notifications",
      },
      {
        title: "Security",
        url: "/settings/security",
      },
    ],
  },
]

// Promoter-specific navigation (shown if user is a promoter)
const navPromoter = [
  {
    title: "Promoter Hub",
    url: "/promoter",
    icon: TrendingUp,
    items: [
      {
        title: "Overview",
        url: "/promoter",
      },
      {
        title: "My Events",
        url: "/promoter/events",
      },
      {
        title: "Earnings",
        url: "/promoter/earnings",
      },
      {
        title: "Analytics",
        url: "/promoter/analytics",
      },
    ],
  },
  {
    title: "Create Event",
    url: "/promoter/events/new",
    icon: Calendar,
  },
  {
    title: "Check-In",
    url: "/promoter/checkin",
    icon: QrCode,
  },
  {
    title: "Team",
    url: "/promoter/team",
    icon: Users,
  },
]

export function AppSidebar({
  user,
  organizations = [],
  activeOrganization,
  isPromoter = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string
    email: string
    avatar: string
  }
  organizations?: OrganizationInfo[]
  activeOrganization?: Organization | null
  isPromoter?: boolean
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
        {isPromoter && <NavMain items={navPromoter} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={sidebarUser}
          organizations={organizations}
          activeOrganizationId={activeOrganization?.id}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
