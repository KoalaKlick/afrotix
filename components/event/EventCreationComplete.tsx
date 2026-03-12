/**
 * Event Creation Complete Component
 * Shows success message after event creation
 */

import { CheckCircle2, Calendar, ExternalLink, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EventCreationCompleteProps {
    readonly event: {
        id: string;
        title: string;
        slug: string;
    };
    readonly organizationSlug?: string;
}

export function EventCreationComplete({ event, organizationSlug }: EventCreationCompleteProps) {
    const eventUrl = organizationSlug
        ? `/${organizationSlug}/events/${event.slug}`
        : `/events/${event.slug}`;

    return (
        <div className="flex flex-col items-center text-center py-8">
            {/* Success Icon */}
            <div className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-2">Event Created!</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                Your event <span className="font-medium text-foreground">{event.title}</span> has
                been created as a draft. You can now add ticket types, voting categories, or
                publish it when you're ready.
            </p>

            {/* Event Card Preview */}
            <div className="w-full max-w-sm bg-card border rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="size-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-semibold truncate">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">Draft • Just created</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button asChild className="flex-1">
                    <Link href={`/my-events/${event.id}`}>
                        <Edit className="mr-2 size-4" />
                        Edit Event
                    </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                    <Link href={eventUrl} target="_blank">
                        <ExternalLink className="mr-2 size-4" />
                        Preview
                    </Link>
                </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-4 mt-6 text-sm">
                <Link
                    href="/events"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    View All Events
                </Link>
                <Link
                    href="/events/new"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    Create Another
                </Link>
            </div>
        </div>
    );
}
