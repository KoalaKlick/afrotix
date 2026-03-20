"use client";

import Link from "next/link";
import Image from "next/image";
import { Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";

interface OngoingEvent {
    id: string;
    title: string;
    type: string;
    coverImage: string | null;
    venueName: string | null;
    startDate: string | null;
}

interface OngoingEventsProps {
    readonly events: OngoingEvent[];
}

const typeColors: Record<string, string> = {
    voting: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
    ticketed: "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400",
    hybrid: "bg-tertiary-100 text-tertiary-700 dark:bg-tertiary-900/30 dark:text-tertiary-400",
    advertisement: "bg-sepia-100 text-sepia-700 dark:bg-sepia-900/30 dark:text-sepia-400",
};

export function OngoingEvents({ events }: OngoingEventsProps) {
    if (events.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-tertiary-500" />
                </span>
                <h3 className="text-sm font-semibold">Live Now</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                {events.map((event) => {
                    const imageUrl = getEventImageUrl(event.coverImage);
                    return (
                        <Link
                            key={event.id}
                            href={`/my-events/${event.id}`}
                            className="flex min-w-55 max-w-70 items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50"
                        >
                            <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={event.title}
                                        width={44}
                                        height={44}
                                        className="size-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center">
                                        <Radio className="size-5 text-tertiary-500" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{event.title}</p>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <Badge
                                        className={cn(
                                            "text-[10px] px-1.5 py-0",
                                            typeColors[event.type] ?? typeColors.ticketed
                                        )}
                                    >
                                        {event.type}
                                    </Badge>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
