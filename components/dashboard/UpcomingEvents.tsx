/**
 * Upcoming Events Component
 * Shows upcoming events for the organization
 */

import { Calendar, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

function getProgressColor(percentage: number): string {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-green-500";
}

interface UpcomingEvent {
    id: string;
    title: string;
    date: Date;
    location: string;
    ticketsSold: number;
    ticketCapacity: number;
    imageUrl?: string;
}

interface UpcomingEventsProps {
    readonly events: UpcomingEvent[];
    readonly className?: string;
}

function formatEventDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function formatEventTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export function UpcomingEvents({ events, className }: UpcomingEventsProps) {
    if (events.length === 0) {
        return (
            <div className={cn("bg-card border rounded-xl p-6 shadow-sm", className)}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Upcoming Events</h3>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="size-10 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No upcoming events</p>
                    <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                        Create your first event to get started
                    </p>
                    <Button asChild size="sm">
                        <Link href="/my-events/new">Create Event</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("bg-card border rounded-xl p-6 shadow-sm", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Upcoming Events</h3>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/my-events">View All</Link>
                </Button>
            </div>
            <div className="space-y-4">
                {events.map((event) => {
                    const soldPercentage = Math.round(
                        (event.ticketsSold / event.ticketCapacity) * 100
                    );

                    return (
                        <Link
                            key={event.id}
                            href={`/my-events/${event.id}`}
                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors -mx-3"
                        >
                            {/* Event Image/Placeholder */}
                            <div className="size-14 rounded-lg bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                                {event.imageUrl ? (
                                    <Image
                                        src={event.imageUrl}
                                        alt={event.title}
                                        width={56}
                                        height={56}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <Calendar className="size-6 text-primary" />
                                )}
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{event.title}</h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <Calendar className="size-3" />
                                    <span>
                                        {formatEventDate(event.date)} at {formatEventTime(event.date)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <MapPin className="size-3" />
                                    <span className="truncate">{event.location}</span>
                                </div>
                            </div>

                            {/* Tickets Status */}
                            <div className="text-right shrink-0">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="size-3" />
                                    <span>
                                        {event.ticketsSold}/{event.ticketCapacity}
                                    </span>
                                </div>
                                <div className="w-16 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all",
                                            getProgressColor(soldPercentage)
                                        )}
                                        style={{ width: `${soldPercentage}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {soldPercentage}% sold
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// Export sample data for testing
export const sampleUpcomingEvents: UpcomingEvent[] = [
    {
        id: "1",
        title: "Afro Beats Summer Festival",
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        location: "O2 Arena, London",
        ticketsSold: 850,
        ticketCapacity: 1000,
    },
    {
        id: "2",
        title: "Gospel Night Live",
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14 days
        location: "Symphony Hall, Birmingham",
        ticketsSold: 120,
        ticketCapacity: 500,
    },
];
