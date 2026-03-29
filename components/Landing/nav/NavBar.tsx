"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { defaultNavigationLinks, type NavbarNavLink } from '@/lib/const/landing'
import { AfroTixLogo } from '@/components/shared/AfroTixLogo'
import { useOrgBranding } from '@/components/providers/OrgBrandingProvider'
import Image from 'next/image'

const HERO_PAGES = ['/']

export interface NavbarProps {
    navigationLinks?: NavbarNavLink[]
    signInText?: string
    ctaText?: string
}

export const Navbar: React.FC<NavbarProps> = ({
    navigationLinks = defaultNavigationLinks,
    signInText = "Log in",
    ctaText = "Get started",
}) => {
    const pathname = usePathname()
    const { branding } = useOrgBranding()
    const logoUrl = branding.logoUrl
    const orgName = branding.name
    
    // Derive variant directly — no need to store it in state
    const isHero = HERO_PAGES.includes(pathname)

    const [scrolledPast, setScrolledPast] = useState(!isHero)
    const [visible, setVisible] = useState(true)
    const lastScrollY = useRef(0)
    const ticking = useRef(false)

    useEffect(() => {
        // Recompute on every pathname change
        const heroPage = HERO_PAGES.includes(pathname)

        if (!heroPage) {
            setScrolledPast(true)
        } else {
            setScrolledPast(window.scrollY > window.innerHeight - 80)
        }

        setVisible(true)
        lastScrollY.current = window.scrollY

        const handleScroll = () => {
            if (ticking.current) return
            ticking.current = true
            requestAnimationFrame(() => {
                const currentY = window.scrollY
                const diff = currentY - lastScrollY.current

                if (heroPage) {
                    setScrolledPast(currentY > window.innerHeight - 80)
                }

                if (currentY < 60) {
                    setVisible(true)
                } else if (diff > 6) {
                    setVisible(false)
                } else if (diff < -6) {
                    setVisible(true)
                }

                lastScrollY.current = currentY
                ticking.current = false
            })
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [pathname]) // ← pathname only; variant/isHero are derived, not deps

    const isLinkActive = (href: string) => {
        if (href === '/' || href === '/#') return pathname === '/'
        if (href.startsWith('/#')) return false
        return pathname === href
    }

    return (
        <>
            {/* MOBILE — always fixed white bar */}
            <motion.div
                animate={{ y: visible ? 0 : '-100%' }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ pointerEvents: visible ? 'auto' : 'none' }}
                className="md:hidden fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-100 shadow-sm"
            >
                <MobileNav
                    navigationLinks={navigationLinks}
                    signInText={signInText}
                    ctaText={ctaText}
                    isLinkActive={isLinkActive}
                    logoUrl={logoUrl}
                    orgName={orgName}
                />
            </motion.div>

            {/* DESKTOP — slides in after hero (hero mode) or always present (standard) */}
            <AnimatePresence>
                {scrolledPast && (
                    <motion.div
                        key="desktop-nav"
                        initial={{ y: isHero ? '-100%' : 0 }}
                        animate={{ y: visible ? 0 : '-100%' }}
                        exit={{ y: '-100%' }}
                        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ pointerEvents: visible ? 'auto' : 'none' }}
                        className="hidden md:block fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-100 shadow-sm"
                    >
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-20 flex items-center justify-between">
                            <Link href="/" className="flex-shrink-0">
                                {logoUrl ? (
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                                            <Image 
                                                src={logoUrl} 
                                                alt={orgName || "Organization logo"} 
                                                fill 
                                                className="object-contain" 
                                            />
                                        </div>
                                        {orgName && (
                                            <span className="text-lg font-black uppercase tracking-tighter hidden lg:block">
                                                {orgName}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <AfroTixLogo className="h-9 w-auto" />
                                )}
                            </Link>

                            <nav className="flex items-center gap-8">
                                {navigationLinks.map((link) => {
                                    const active = isLinkActive(link.href)
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                "relative py-1 text-sm font-medium transition-colors",
                                                active ? 'text-black' : 'text-black/60 hover:text-black'
                                            )}
                                        >
                                            {link.label}
                                            {active && (
                                                <motion.div
                                                    layoutId="nav-underline"
                                                    className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#009A44]"
                                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                                />
                                            )}
                                        </Link>
                                    )
                                })}
                            </nav>

                            <div className="flex items-center gap-4">
                                <Link
                                    href="/auth/login"
                                    className="text-sm font-medium text-black/70 hover:text-black transition-colors"
                                >
                                    {signInText}
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="bg-[#009A44] hover:bg-[#007a36] text-white text-sm font-semibold px-5 py-2.5 transition-colors duration-200"
                                >
                                    {ctaText}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

function MobileNav({
    navigationLinks,
    signInText,
    ctaText,
    isLinkActive,
    logoUrl,
    orgName,
}: {
    navigationLinks: NavbarNavLink[]
    signInText: string
    ctaText: string
    isLinkActive: (href: string) => boolean
    logoUrl: string | null
    orgName: string | null
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <div className="h-16 px-4 flex items-center justify-between">
                <Link href="/">
                    {logoUrl ? (
                        <div className="flex items-center gap-2">
                             <div className="relative h-8 w-8 overflow-hidden rounded-md">
                                <Image 
                                    src={logoUrl} 
                                    alt={orgName || "Organization logo"} 
                                    fill 
                                    className="object-contain" 
                                />
                            </div>
                            {orgName && (
                                <span className="text-sm font-black uppercase tracking-tighter truncate max-w-[120px]">
                                    {orgName}
                                </span>
                            )}
                        </div>
                    ) : (
                        <AfroTixLogo className="h-8 w-auto" />
                    )}
                </Link>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-black/70 hover:text-black"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="bg-white border-t border-gray-100 px-4 pb-6"
                    >
                        <div className="flex flex-col gap-4 pt-4">
                            {navigationLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "text-base font-semibold transition-colors",
                                        isLinkActive(link.href)
                                            ? 'text-[#009A44]'
                                            : 'text-black/80 hover:text-black'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                                <Link
                                    href="/auth/login"
                                    onClick={() => setIsOpen(false)}
                                    className="text-center border border-gray-200 text-sm font-semibold py-3 hover:bg-gray-50 transition-colors"
                                >
                                    {signInText}
                                </Link>
                                <Link
                                    href="/auth/register"
                                    onClick={() => setIsOpen(false)}
                                    className="text-center bg-[#009A44] hover:bg-[#007a36] text-white text-sm font-semibold py-3 transition-colors"
                                >
                                    {ctaText}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

Navbar.displayName = "Navbar"
export default Navbar