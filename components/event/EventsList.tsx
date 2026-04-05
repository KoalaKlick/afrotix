"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MoreVertical, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getEventLifecycleStatus, getEventPublicationStatus } from "@/lib/event-status";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { deleteExistingEvent } from "@/lib/actions/event";

const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    upcoming: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
    ongoing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    ended: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

interface Event {
    id: string;
    title: string;
    slug: string;
    type: string;
    status: string;
    isPublic: boolean;
    coverImage: string | null;
    startDate: string | Date | null;
    venueName: string | null;
    isVirtual: boolean;
}

interface EventsListProps {
    readonly events: Event[];
    readonly organizationSlug?: string;
}

export function EventsList({ events, organizationSlug }: EventsListProps) {
    const [isDeleting, startTransition] = useTransition();
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

    const handleDelete = async () => {
        if (!eventToDelete) return;

        startTransition(async () => {
            const result = await deleteExistingEvent(eventToDelete.id);
            if (result.success) {
                toast.success("Event deleted successfully");
                setEventToDelete(null);
            } else {
                toast.error(result.error ?? "Failed to delete event");
            }
        });
    };

    return (
        <>
        <div className="grid gap-4">
            {events.map((event) => {
                const coverImageUrl = getEventImageUrl(event.coverImage);
                const lifecycleStatus = getEventLifecycleStatus(event);
                const publicationStatus = getEventPublicationStatus(event.status);
                const canViewPublicPage = Boolean(organizationSlug && event.isPublic && publicationStatus === "published");

                return (
                    <div
                        key={event.id}
                        className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start gap-4">
                            {/* Event Image */}
                            <div className="size-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                                {coverImageUrl ? (
                                    <Image
                                        src={coverImageUrl}
                                        alt={event.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <Calendar className="size-6 text-muted-foreground" />
                                )}
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <Link
                                            href={`/my-events/${event.id}`}
                                            className="font-semibold hover:underline line-clamp-1"
                                        >
                                            {event.title}
                                        </Link>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {event.venueName ?? (event.isVirtual ? "Virtual Event" : "Location TBD")}
                                        </p>
                                    </div>
                                    <Badge className={statusColors[lifecycleStatus]}>
                                        {lifecycleStatus}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    {event.startDate && (
                                        <span>
                                            {new Date(event.startDate).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    )}
                                    <span>{event.type}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {canViewPublicPage && (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/${organizationSlug}/event/${event.slug}`}>
                                                <Eye className="mr-2 size-4" />
                                                View Public Page
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link href={`/my-events/${event.id}`}>
                                            <Edit className="mr-2 size-4" />
                                            Edit
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setEventToDelete(event);
                                        }}
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                );
            })}
            </div>

            <AlertDialog
                open={!!eventToDelete}
                onOpenChange={(open) => !open && !isDeleting && setEventToDelete(null)}
            >
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the event "{eventToDelete?.title}".
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Event"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
