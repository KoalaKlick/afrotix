"use client";

import { motion } from "motion/react";
import { EventCard, type DbEvent } from "@/components/Landing/sections/revamp-events";
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";
import type { EventType } from "@/lib/generated/prisma";
import { EventsFilter } from "./EventsFilter";

interface EventsPageClientProps {
    events: DbEvent[];
    q?: string;
    type?: string;
}

export function EventsPageClient({ events, q, type }: EventsPageClientProps) {
    return (
        <>
            <header className="mb-16 text-center pt-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 bg-gradient-to-r from-black via-zinc-800 to-black bg-clip-text text-transparent">
                        All Events.
                    </h1>
                 
                    <div className="mt-8">
                        <EventsFilter />
                    </div>
                </motion.div>
            </header>

            {events.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {events.map((event, i) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                        >
                            <EventCard item={event} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-32 bg-white/40 rounded-[3rem] border border-dashed border-zinc-300 backdrop-blur-xs"
                >
                    <NoEventsIllustration className="w-72 h-auto mx-auto mb-8 opacity-80" />
                    <h3 className="text-2xl font-bold text-zinc-800 mb-2">
                        {q || type ? "No matches found" : "No events yet"}
                    </h3>
                    <p className="text-zinc-500 max-w-sm mx-auto">
                        {q || type
                            ? "Try adjusting your filters or search terms to find what you're looking for."
                            : "Check back soon! We're constantly adding new and exciting events."}
                    </p>
                </motion.div>
            )}
        </>
    );
}
