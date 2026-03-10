'use client'

import { useId } from 'react'
import { africaPaths } from '@/app/auth/africa-paths'
import type { StaticImageData } from 'next/image'

interface AfricaImageClipProps {
    /** Image source - can be a URL string or imported image */
    src: string | StaticImageData
    /** Alt text for the image */
    alt?: string
    /** Optional className for the container */
    className?: string
    /** Show pan-African colored border */
    showBorder?: boolean
    /** Border stroke width */
    borderWidth?: number
}

/**
 * A simple reusable component that clips an image to the shape of Africa.
 * No animations, no reactivity - just a clean image clip.
 */
export default function AfricaImageClip({
    src,
    alt = 'Africa map',
    className = '',
    showBorder = true,
    borderWidth = 8,
}: AfricaImageClipProps) {
    const clipId = useId()
    const gradientId = useId()
    const outlineFilterId = useId()
    const maskId = useId()

    return (
        <div className={className} style={{ position: 'relative' }}>
            <svg
                viewBox="0 0 1000 1001"
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                aria-label={alt}
                style={{ display: 'block', overflow: 'visible' }}
            >
                <title>{alt}</title>
                <defs>
                    <clipPath id={clipId}>
                        {africaPaths.map((country) => (
                            <path key={country.id} d={country.d} />
                        ))}
                    </clipPath>

                    {/* Pan-African gradient: green top -> yellow middle -> red bottom */}
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#009739" />
                        <stop offset="50%" stopColor="#FCD116" />
                        <stop offset="100%" stopColor="#E31B23" />
                    </linearGradient>

                    {/* Filter to create dilated outline */}
                    <filter id={outlineFilterId} x="-10%" y="-10%" width="120%" height="120%">
                        <feMorphology in="SourceAlpha" operator="dilate" radius={borderWidth / 2} result="dilated" />
                        <feFlood floodColor="white" result="color" />
                        <feComposite in="color" in2="dilated" operator="in" result="outline" />
                    </filter>

                    {/* Mask from all country paths */}
                    <mask id={maskId}>
                        <g filter={`url(#${outlineFilterId})`}>
                            {africaPaths.map((country) => (
                                <path key={country.id} d={country.d} fill="white" />
                            ))}
                        </g>
                    </mask>
                </defs>

                {/* Pan-African gradient border - drawn as a rectangle masked to the dilated outline shape */}
                {showBorder && (
                    <rect
                        x="0"
                        y="0"
                        width="1000"
                        height="1001"
                        fill={`url(#${gradientId})`}
                        mask={`url(#${maskId})`}
                    />
                )}

                {/* Clipped image */}
                <image
                    href={typeof src === 'string' ? src : src.src}
                    width="1000"
                    height="1001"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${clipId})`}
                />
            </svg>
        </div>
    )
}
