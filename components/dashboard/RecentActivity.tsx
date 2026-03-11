/**
 * Recent Activity Component
 * Shows recent activity for the organization
 */

import { Calendar, Ticket, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityType = "event" | "ticket" | "member" | "revenue";

interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    timestamp: Date;
}

interface RecentActivityProps {
    readonly activities: Activity[];
    readonly className?: string;
}

const activityIcons: Record<ActivityType, typeof Calendar> = {
    event: Calendar,
    ticket: Ticket,
    member: Users,
    revenue: DollarSign,
};

const activityColors: Record<ActivityType, string> = {
    event: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    ticket: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    member: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    revenue: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
};

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function RecentActivity({ activities, className }: RecentActivityProps) {
    if (activities.length === 0) {
        return (
            <div className={cn("bg-card border rounded-xl p-6 shadow-sm", className)}>
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="size-10 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Activity will appear here once you start creating events
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("bg-card border rounded-xl p-6 shadow-sm", className)}>
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {activities.map((activity) => {
                    const Icon = activityIcons[activity.type];
                    const colorClass = activityColors[activity.type];

                    return (
                        <div key={activity.id} className="flex items-start gap-3">
                            <div
                                className={cn(
                                    "flex size-9 items-center justify-center rounded-lg shrink-0",
                                    colorClass
                                )}
                            >
                                <Icon className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{activity.title}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {activity.description}
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                                {formatRelativeTime(activity.timestamp)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Export placeholder data for empty states
export const emptyActivities: Activity[] = [];

// Export sample data for testing
export const sampleActivities: Activity[] = [
    {
        id: "1",
        type: "event",
        title: "New Event Created",
        description: "Afro Beats Night - March 15, 2026",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    },
    {
        id: "2",
        type: "ticket",
        title: "Ticket Sold",
        description: "VIP Pass for Afro Beats Night",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
        id: "3",
        type: "member",
        title: "Team Member Added",
        description: "John Doe joined as Admin",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
];
