"use client";

import { PublicEventCard } from "./PublicEventCard";
import type { Event } from "@/lib/generated/prisma";
import { motion } from "motion/react";

interface OrgEventListProps {
    readonly events: Event[];
}

export function OrgEventList({ events }: OrgEventListProps) {
    if (events.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">
                    No upcoming public events.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, i) => (
                <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                    <PublicEventCard event={event} />
                </motion.div>
            ))}
        </div>
    );
}
