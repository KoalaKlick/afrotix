import {
    Building2,
    Calendar,
    CreditCard,
    Home,
    TrendingUp,
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
    },
    {
        title: "Events",
        url: "/my-events",
        icon: Calendar,
        items: [
            {
                title: "My Events",
                url: "/my-events",
            },
            {
                title: "Create Event",
                url: "/my-events/new",
            },
        ],
    },
    // {
    //     title: "Promoter Hub",
    //     url: "/promoter",
    //     icon: TrendingUp,
    // },
    {
        title: "Billing",
        url: "/organization/billing",
        icon: CreditCard,
    },
    {
        title: "Organization",
        url: "/organization/manage",
        icon: Building2,
    },
]

