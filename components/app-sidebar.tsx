"use client"

import type * as React from "react"

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
  useSidebar,
} from "@/components/ui/sidebar"
import type { Organization } from "@/lib/generated/prisma"
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

function SidebarLogoContent({ activeOrganization }: { readonly activeOrganization?: Organization | null }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 100 90" className="size-6" xmlns="http://www.w3.org/2000/svg">
          <title>AT</title>
          <text
            x="50"
            y="78"
            fontFamily="'Poppins', Arial, sans-serif"
            fontSize="90"
            fontWeight="800"
            textAnchor="middle"
            letterSpacing="-4"
          >
            <tspan fill="#C41E3A">A</tspan>
            <tspan fill="#228B22">.</tspan>
          </text>
        </svg>
      </div>
    )
  }

  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <AfroTixLogo className="h-6" />
      <span className="truncate text-xs text-black/70">
        {activeOrganization ? `@${activeOrganization.slug}` : "Events Platform"}
      </span>
    </div>
  )
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
    <Sidebar
      collapsible="icon"
      className="border-sidebar-border/40"
      style={
        {
          "--sidebar": "linear-gradient(180deg, rgba(21, 19, 17, 0.98) 0%, rgba(16, 16, 15, 0.98) 100%)",
          "--sidebar-foreground": "#f7f1df",
          "--sidebar-accent": "rgba(255, 248, 232, 0.08)",
          "--sidebar-accent-foreground": "#fffbea",
          "--sidebar-border": "rgba(234, 179, 8, 0.18)",
          "--sidebar-primary": "#dc2626",
          "--sidebar-primary-foreground": "#fff8e8",
        } as React.CSSProperties
      }
      {...props}
    >
      <div className="relative flex h-full flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.14),transparent_26%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,248,232,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,248,232,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-secondary-600/20 via-black/0 to-tertiary-600/20" />

        <SidebarHeader className="relative z-10 border-b border-white/8 px-3 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="xl"
                asChild
                className="rounded-md border py-3 border-black/10 bg-[radial-gradient(circle_at_top_left,rgba(38,288,38,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.14),transparent_26%)] hover:bg-black/15 transition-colors duration-300 px-3 backdrop-blur-sm"
              >
                <Link href="/dashboard">
                  <SidebarLogoContent activeOrganization={activeOrganization} />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="relative z-10 px-2 py-3">
          <NavMain items={navMain} />
        </SidebarContent>
        <SidebarFooter className="relative z-10 border-t border-white/8 px-3 py-3">
          <NavUser
            user={sidebarUser}
            organizations={organizations}
            activeOrganizationId={activeOrganization?.id}
            pendingInvitations={pendingInvitations}
          />
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
