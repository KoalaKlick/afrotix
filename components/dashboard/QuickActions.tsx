/**
 * Quick Actions Component
 * Displays quick action buttons for common tasks
 */

"use client";

import Link from "next/link";
import { Calendar, Plus, QrCode, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
    const actions = [
        {
            title: "Create Event",
            description: "Set up a new event",
            icon: Plus,
            href: "/promoter/events/new",
            variant: "default" as const,
        },
        {
            title: "Manage Events",
            description: "View all your events",
            icon: Calendar,
            href: "/promoter/events",
            variant: "outline" as const,
        },
        {
            title: "Check-In",
            description: "Scan tickets at the door",
            icon: QrCode,
            href: "/promoter/checkin",
            variant: "outline" as const,
        },
        {
            title: "Team Members",
            description: "Manage your team",
            icon: Users,
            href: "/promoter/team",
            variant: "outline" as const,
        },
        {
            title: "Settings",
            description: "Organization settings",
            icon: Settings,
            href: "/settings/organization",
            variant: "outline" as const,
        },
    ];

    return (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {actions.map((action) => (
                    <Button
                        key={action.title}
                        variant={action.variant}
                        className="h-auto flex-col gap-2 py-4"
                        asChild
                    >
                        <Link href={action.href}>
                            <action.icon className="size-5" />
                            <span className="text-xs font-medium">{action.title}</span>
                        </Link>
                    </Button>
                ))}
            </div>
        </div>
    );
}
