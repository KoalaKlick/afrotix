"use client";

import { useState, useEffect, useCallback } from "react";
// Data fetching now handled via API route
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EventsList } from "@/components/event/EventsList";
import { CustomizableEventStats } from "@/components/event";
import { CreateEventDrawer } from "@/components/event/CreateEventDrawer";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";

export default function MyEventsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    // Reset scroll on every page visit so content is never hidden behind the fixed header
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/auth/login");
            return;
        }

        const res = await fetch("/api/my-events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
        });
        if (!res.ok) {
            router.push("/dashboard");
            return;
        }
        const { events, stats, organization } = await res.json();
        setData({ events, stats, organization, user });
        setLoading(false);
    }, [router, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return <div className="p-8 text-center animate-pulse font-medium text-muted-foreground">Loading dashboard...</div>;
    }

    const { events, stats, organization } = data;

    return (
        <>
            <PageHeader breadcrumbs={[{ label: "My Events" }]} />

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                {/* Header — sticky so it stays visible while scrolling the events list */}
                <div className="sticky top-16 z-10 -mx-4 bg-background/95 backdrop-blur-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b">
                    <div>
                        <h1 className="text-2xl font-bold">My Events</h1>
                        <p className="text-muted-foreground">
                            Manage your events and track performance
                        </p>
                    </div>
                    <Button
                        variant='primary'
                        size='sm'
                        onClick={() => setIsDrawerOpen(true)}
                    >
                        <Plus className="mr-2 size-4" />
                        Create Event
                    </Button>
                </div>

                {/* Stats Overview */}
                <CustomizableEventStats stats={stats} />

                {/* Events List */}
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <NoEventsIllustration className="w-56 h-auto mb-6" />
                        <h2 className="text-xl font-semibold mb-2">No events yet</h2>
                        {/* <p className="text-muted-foreground mb-6 max-w-sm">
                            Create your first event to start selling tickets and engaging your audience.
                        </p> */}
                        <Button onClick={() => setIsDrawerOpen(true)} variant='default' size="default">
                            {/* <Plus className="mr-2 size-4" /> */}
                            Create Your First Event
                        </Button>
                    </div>
                ) : (
                    <EventsList 
                        events={events} 
                        organizationSlug={organization?.slug} 
                        onRefresh={fetchData}
                    />
                )}
            </div>

            <CreateEventDrawer
                isOpen={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                organizationSlug={organization?.slug}
            />
        </>
    );
}
