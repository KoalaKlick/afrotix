"use client"

import type { EventItem } from "@/lib/const/landing"
import { cn } from "@/lib/utils"

interface EventCardProps {
    readonly item: EventItem
    readonly className?: string
    readonly size?: 'default' | 'large'
}

// Tailwind text color class per accent — SVG uses currentColor
const accentTextColors: Record<string, string> = {
    red:    'text-[#CE1126]',
    yellow: 'text-[#FFCD00]',
    green:  'text-[#009A44]',
}

const badgeColors: Record<string, string> = {
    red:    'text-[#CE1126]',
    yellow: 'text-[#FFCD00]',
    green:  'text-[#009A44]',
}

/**
 * Side accent derived from the provided Inkscape SVG.
 * Original viewBox: 0 0 210 297 — the shape sits flush on the right edge,
 * bulging left (convex) in the middle, tapering to near-points top & bottom.
 * We keep only the path and let it fill via currentColor.
 */
function SideAccent({ colorClass }: { colorClass: string }) {
    return (
        <svg
            className={cn("absolute right-0 top-0 h-full w-24 z-10", colorClass)}
            viewBox="0 0 210 297"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <path
                d="M 179.69167,0.37081617 196.23673,146.38046 179.15249,297.0266 l 31.2116,0.35696 V 0.01812264 Z"
                fill="currentColor"
            />
        </svg>
    )
}

export function EventCard({ item, className, size = 'default' }: EventCardProps) {
    const colorClass = accentTextColors[item.accentColor] ?? 'text-[#009A44]'

    return (
        <div
            className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl",
                size === 'large' ? 'aspect-[3/4]' : 'aspect-[4/3]',
                className
            )}
        >
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${item.image})` }}
            />

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-colors group-hover:from-black/75" />

            {/* Side accent */}
            <SideAccent colorClass={colorClass} />

            {/* Content */}
            <div className="absolute inset-0 p-4 pr-9 flex flex-col justify-end">
                <h3 className={cn(
                    "text-white font-bold leading-tight mb-1",
                    size === 'large' ? 'text-lg' : 'text-sm'
                )}>
                    {item.title}
                </h3>

                {item.subtitle && (
                    <p className="text-white/65 text-xs mb-3 line-clamp-2 leading-relaxed">
                        {item.subtitle}
                    </p>
                )}

                <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                        "text-white text-[10px] font-bold uppercase px-2 py-1 rounded-sm tracking-wide",
                        badgeColors[item.accentColor] 
                    )}>
                        {item.category}
                    </span>
                    <span className="text-white/55 text-[10px] shrink-0">
                        {item.date}
                    </span>
                </div>
            </div>
        </div>
    )
}