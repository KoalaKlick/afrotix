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
import type { LucideIcon } from "lucide-react"
import type { OrganizationRole } from "@/lib/generated/prisma"

export type OrganizationInfo = {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    role: OrganizationRole
    memberCount?: number
}

export interface NavItem {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
        title: string
        url: string
    }[]
}

export const navMain: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        isActive: true,
    },
    {
        title: "Events",
        url: "/my-events",
        icon: Calendar,
        items: [
            {
                title: "Explore",
                url: "/events",
            },
            {
                title: "My Events",
                url: "/my-events",
            },
            {
                title: "My Tickets",
                url: "/tickets",
            },
            {
                title: "Create Event",
                url: "/my-events/new",
            },
        ],
    },
    {
        title: "Organization",
        url: "/organization/manage",
        icon: Building2,
    },
]
