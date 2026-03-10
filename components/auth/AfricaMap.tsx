"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { africaPaths, type CountryPath } from "../../app/auth/africa-paths";

// Pan-African inspired color palette
const PAN_AFRICAN_COLORS = [
    "#E31B23", "#FCD116", "#009739", "#000000",
    "#CE1126", "#007A3D", "#F0E130", "#C8102E", "#006B3F"
] as const;

interface AfricaMapProps {
    readonly images: readonly string[];
    readonly interval?: number;
    readonly showHoverColor?: boolean;
    readonly showTransitionColor?: boolean;
    readonly staggerDelay?: number;
}

// Static country path - no animation library needed
const CountryPathComponent = memo(function CountryPathComponent({
    country,
    color,
    revealDelay,
    baseImageIdx,
    targetImageIdx,
    isTransitioning,
    showColorPulse,
    showHoverColor,
    hasInitiallyRevealed,
}: {
    country: CountryPath;
    color: string;
    revealDelay: number;
    baseImageIdx: number;
    targetImageIdx: number;
    isTransitioning: boolean;
    showColorPulse: boolean;
    showHoverColor: boolean;
    hasInitiallyRevealed: boolean;
}) {
    return (
        <g className="country-group">
            {/* Initial color layer - visible before first reveal, fades out */}
            <path
                d={country.d}
                fill={color}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                style={{
                    opacity: hasInitiallyRevealed ? 0 : 1,
                    transition: hasInitiallyRevealed ? `opacity 0.6s ease-out ${revealDelay}s` : 'none',
                }}
            />

            {/* Base image layer - fades in on initial reveal, then stays visible */}
            <path
                d={country.d}
                fill={`url(#map-image-${baseImageIdx})`}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                style={{
                    opacity: hasInitiallyRevealed ? 1 : 0,
                    transition: hasInitiallyRevealed ? `opacity 0.6s ease-out ${revealDelay}s` : 'none',
                }}
            />

            {/* Transition image layer - fades in over the base during image cycling */}
            <path
                d={country.d}
                fill={`url(#map-image-${targetImageIdx})`}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                style={{
                    opacity: isTransitioning ? 1 : 0,
                    transition: isTransitioning ? `opacity 0.6s ease-out ${revealDelay}s` : 'none',
                    willChange: 'opacity'
                }}
            />

            {/* Color pulse layer - CSS animation */}
            {showColorPulse && hasInitiallyRevealed && (
                <path
                    d={country.d}
                    fill={color}
                    className="animate-pulse-fade"
                    style={{
                        animationDelay: `${revealDelay}s`,
                    }}
                />
            )}

            {/* Hover layer */}
            {showHoverColor && (
                <path
                    d={country.d}
                    fill={color}
                    className="cursor-pointer transition-opacity duration-150 opacity-0 hover:opacity-85"
                    style={{ pointerEvents: "all" }}
                />
            )}
            <title>{country.name}</title>
        </g>
    );
});

export default function AfricaMap({
    images,
    interval = 10000,
    showHoverColor = true,
    showTransitionColor = true,
    staggerDelay = 0.02,
}: AfricaMapProps) {
    const [baseIdx, setBaseIdx] = useState(0);
    const [targetIdx, setTargetIdx] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showPulse, setShowPulse] = useState(true);
    const [initialReveal, setInitialReveal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const totalAnimationDuration = africaPaths.length * staggerDelay * 1000 + 600;

    // Stable randomized reveal order - computed once on client only to avoid hydration mismatch
    const revealOrder = useMemo(() => {
        if (!isMounted) {
            // Return sequential order for SSR to ensure hydration match
            return africaPaths.map((_, i) => i);
        }
        // Randomize only on client after mount
        const indices = africaPaths.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices;
    }, [isMounted]);

    // Set mounted state on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Colors per country
    const colorMap = useMemo(
        () => africaPaths.map((_, i) => PAN_AFRICAN_COLORS[i % PAN_AFRICAN_COLORS.length]),
        []
    );

    // Trigger initial reveal on mount with a small delay to ensure colors are visible first
    useEffect(() => {
        const revealTimer = setTimeout(() => {
            setInitialReveal(true);
        }, 100); // Small delay to show colors first

        const pulseTimer = setTimeout(() => setShowPulse(false), totalAnimationDuration + 100);
        return () => {
            clearTimeout(revealTimer);
            clearTimeout(pulseTimer);
        };
    }, [totalAnimationDuration]);

    // Image cycling logic
    useEffect(() => {
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            // 1. Start transition to next index
            const nextIdx = (targetIdx + 1) % images.length;
            setTargetIdx(nextIdx);
            setIsTransitioning(true);

            if (showTransitionColor) setShowPulse(true);

            // 2. After transition completes, set next as base and reset transition state
            setTimeout(() => {
                setBaseIdx(nextIdx);
                setIsTransitioning(false);
                setShowPulse(false);
            }, totalAnimationDuration);

        }, interval);

        return () => clearInterval(timer);
    }, [images.length, interval, targetIdx, totalAnimationDuration, showTransitionColor]);

    // Calculate delay for each country
    const getRevealDelay = (originalIndex: number) => {
        return revealOrder.indexOf(originalIndex) * staggerDelay;
    };

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* CSS for pulse animation */}
            <style>{`
                @keyframes pulse-fade {
                    0% { opacity: 0; }
                    40% { opacity: 0.85; }
                    100% { opacity: 0; }
                }
                .animate-pulse-fade {
                    animation: pulse-fade 0.4s ease-out forwards;
                    will-change: opacity;
                }
            `}</style>

            <svg
                viewBox="0 0 1000 1001"
                className="absolute inset-0 w-full h-full drop-shadow-[0_20px_50px_rgba(aa,0,0,0.5)]"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
                aria-labelledby="africa-map-title"
            >
                <title id="africa-map-title">Africa Map</title>
                <defs>
                    {images.map((img, idx) => (
                        <pattern
                            key={img}
                            id={`map-image-${idx}`}
                            patternUnits="userSpaceOnUse"
                            width="1000"
                            height="1001"
                        >
                            <image
                                href={img}
                                width="1000"
                                height="1001"
                                preserveAspectRatio="xMidYMid slice"
                            />
                        </pattern>
                    ))}

                    <filter id="sepia-overlay">
                        <feColorMatrix
                            type="matrix"
                            values="0.393 0.769 0.189 0 0
                                    0.349 0.686 0.168 0 0
                                    0.272 0.534 0.131 0 0
                                    0 0 0 1 0"
                        />
                    </filter>
                </defs>

                {/* Sepia background */}
                {/* <image
                    href={images[targetIdx]}
                    width="1000"
                    height="1001"
                    preserveAspectRatio="xMidYMid slice"
                    filter="url(#sepia-overlay)"
                    opacity="0.4"
                    className="transition-opacity duration-500"
                /> */}

                {/* Country paths */}
                <g id="africa-countries">
                    {africaPaths.map((country, idx) => (
                        <CountryPathComponent
                            key={country.id}
                            country={country}
                            color={colorMap[idx]}
                            revealDelay={getRevealDelay(idx)}
                            baseImageIdx={baseIdx}
                            targetImageIdx={targetIdx}
                            isTransitioning={isTransitioning}
                            showColorPulse={showPulse}
                            showHoverColor={showHoverColor}
                            hasInitiallyRevealed={initialReveal}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
}
