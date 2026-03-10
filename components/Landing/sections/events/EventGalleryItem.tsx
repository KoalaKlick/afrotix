"use client"

import type { EventItem } from "@/lib/const/landing"

const accentColorMap: Record<EventItem['accentColor'], string> = {
    red: '#C62828',
    yellow: '#F9A825',
    green: '#2E7D32',
    black: '#212121',
}

interface EventGalleryItemProps {
    readonly item: EventItem
}

export function EventGalleryItem({ item }: EventGalleryItemProps) {
    const color = accentColorMap[item.accentColor]

    return (
        <div
            className="relative cursor-pointer h-[500px] w-[400px] shrink-0 overflow-hidden rounded-xl bg-cover bg-center max-sm:h-[350px] max-sm:w-[280px]"
            style={{
                backgroundImage: `url(${item.image})`,
            }}
        >
            {/* Gradient overlay */}
            <div
                className="absolute inset-0 mix-blend-multiply"
                style={{
                    background: `linear-gradient(to bottom, transparent 60%, ${color})`,
                }}
            />
            {/* Content */}
            <div className="absolute bottom-7.5 left-7.5 z-10 max-sm:bottom-5 max-sm:left-5">
                <span
                    className="mb-2 block font-mono text-sm"
                    style={{ color }}
                >
                    0{item.id}
                </span>
                <h2 className="m-0 text-[28px] font-semibold text-[#f5f5f5] max-sm:text-[22px]">
                    {item.title}
                </h2>
            </div>
        </div>
    )
}
