"use client"

import { useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { eventItems, type EventItem } from "@/lib/const/landing"
import { EventGallery } from "./EventGallery"
import { Section } from "../../shared/Section"

interface EventsSectionProps {
    readonly title?: string
    readonly items?: EventItem[]
}

export function EventsSection({
    title = "Ongoing Events",
    items = eventItems,
}: EventsSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    // Transform scroll progress to horizontal movement (0% to 100%)
    // The actual pixel distance is calculated in CSS using items count
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"])

    return (
        <Section id="events" className="h-auto overflow-visible bg-primary-950 relative">
            {/* Sticky title that stays on top while gallery scrolls horizontally */}
            <div className="sticky top-16 md:top-16 z-20 py-6 bg-inherit">
                <div className=" bg-primary-950/50 backdrop-blur-3xl w-fit mx-auto">   <h2 className="text-4xl md:text-6xl font-bold text-center text-primary-50 mb-1">
                    {title}
                </h2>
                    <p className="text-center text-primary-200">Explore ongoing events and discover what's happening now.</p>
                </div> </div>
            <EventGallery items={items} x={x} scrollProgress={scrollYProgress} containerRef={containerRef} />
        </Section>
    )
}
