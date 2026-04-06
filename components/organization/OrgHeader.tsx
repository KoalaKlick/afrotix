"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useOrgBranding } from "@/components/providers/OrgBrandingProvider";
import { AfroTixLogo } from "@/components/shared/AfroTixLogo";

interface OrgHeaderProps {
    /** Organization slug for linking back to the org page */
    readonly slug: string;
}

export function OrgHeader({ slug }: OrgHeaderProps) {
    const { branding } = useOrgBranding();
    const { logoUrl, name } = branding;

    const [scrolledPast, setScrolledPast] = useState(false);
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            if (ticking.current) return;
            ticking.current = true;
            requestAnimationFrame(() => {
                const currentY = window.scrollY;
                const diff = currentY - lastScrollY.current;

                // Show the bar after scrolling past the hero area (~300px)
                setScrolledPast(currentY > 300);

                if (currentY < 60) {
                    setVisible(true);
                } else if (diff > 6) {
                    setVisible(false);
                } else if (diff < -6) {
                    setVisible(true);
                }

                lastScrollY.current = currentY;
                ticking.current = false;
            });
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {scrolledPast && (
                <motion.header
                    key="org-header"
                    initial={{ y: "-100%" }}
                    animate={{ y: visible ? 0 : "-100%" }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ pointerEvents: visible ? "auto" : "none" }}
                    className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm"
                >
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between">
                        {/* Left: back arrow + org logo + name */}
                        <Link
                            href={`/${slug}`}
                            className="flex items-center gap-2.5 min-w-0 group"
                        >
                            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                            {logoUrl ? (
                                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                                    <Image
                                        src={logoUrl}
                                        alt={name || "Organization logo"}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="h-8 w-8 shrink-0 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-black text-brand-primary">
                                        {name?.charAt(0)?.toUpperCase() || "O"}
                                    </span>
                                </div>
                            )}
                            {name && (
                                <span className="text-sm font-bold uppercase tracking-tight truncate max-w-40">
                                    {name}
                                </span>
                            )}
                        </Link>

                        {/* Right: powered-by */}
                        <Link href="/" className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider hidden sm:inline">
                                Powered by
                            </span>
                            <AfroTixLogo className="h-4 w-auto" />
                        </Link>
                    </div>
                </motion.header>
            )}
        </AnimatePresence>
    );
}
