import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import { getUserRoleInOrganization, getOrganizationById } from "@/lib/dal/organization";
import { getOrganizationEvents, getOrganizationEventStats } from "@/lib/dal/event";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    ongoing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    ended: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default async function MyEventsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const organizationId = await getEffectiveOrganizationId(user.id);
    if (!organizationId) {
        redirect("/organization/new?setup=true");
    }

    const role = await getUserRoleInOrganization(user.id, organizationId);
    if (!role) {
        redirect("/dashboard");
    }

    const [events, stats, organization] = await Promise.all([
        getOrganizationEvents(organizationId),
        getOrganizationEventStats(organizationId),
        getOrganizationById(organizationId),
    ]);

    return (
        <>
            <PageHeader breadcrumbs={[{ label: "My Events" }]} />

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                {/* Header with stats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">My Events</h1>
                        <p className="text-muted-foreground">
                            {stats.total} event{stats.total !== 1 ? "s" : ""} • {stats.published} published • {stats.draft} drafts
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/my-events/new">
                            <Plus className="mr-2 size-4" />
                            Create Event
                        </Link>
                    </Button>
                </div>

                {/* Events List */}
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                            <Calendar className="size-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No events yet</h2>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Create your first event to start selling tickets and engaging your audience.
                        </p>
                        <Button asChild size="lg">
                            <Link href="/my-events/new">
                                <Plus className="mr-2 size-4" />
                                Create Your First Event
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Event Image */}
                                    <div className="size-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                        {event.coverImage ? (
                                            <img
                                                src={event.coverImage}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
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
                                            <Badge className={statusColors[event.status]}>
                                                {event.status}
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
                                            <DropdownMenuItem asChild>
                                                <Link href={`/${organization?.slug}/event/${event.slug}`}>
                                                    <Eye className="mr-2 size-4" />
                                                    View Public Page
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/my-events/${event.id}`}>
                                                    <Edit className="mr-2 size-4" />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="mr-2 size-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
