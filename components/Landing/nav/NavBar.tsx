"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { defaultNavigationLinks, type NavbarNavLink } from '@/lib/const/landing'
import { AfroTixLogo } from '@/components/shared/AfroTixLogo'

export interface NavbarProps {
    navigationLinks?: NavbarNavLink[]
    signInText?: string
    ctaText?: string
}

function getNavLinkClass(scrolled: boolean, active: boolean) {
    if (scrolled) {
        return active ? 'text-black' : 'text-black/70 hover:text-black'
    }
    return active ? 'text- font-medium' : 'text-whi hover:text-black/50'
}

const NavLink = ({
    href,
    label,
    active = false,
    scrolled = false,
}: {
    href: string
    label: string
    active?: boolean
    scrolled?: boolean
}) => (
    <Link
        href={href}
        className={cn(
            "relative py-1 flex items-center gap-1 text-sm font-semibold transition-colors",
            getNavLinkClass(scrolled, active)
        )}
    >
        {label}
        {active && (
            <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-1 left-0 w-full h-0.5 bg-sepia"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
        )}
    </Link>
)

export const Navbar: React.FC<NavbarProps> = ({
    navigationLinks = defaultNavigationLinks,
    signInText = "Sign In",
    ctaText = "Become a Promoter",
}) => {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [visible, setVisible] = useState(true)

    const lastScrollY = useRef(0)
    const ticking = useRef(false)

    useEffect(() => {
        const handleScroll = () => {
            if (ticking.current) return
            ticking.current = true
            requestAnimationFrame(() => {
                const currentY = window.scrollY
                const diff = currentY - lastScrollY.current
                setScrolled(currentY > 10)
                if (currentY < 60) {
                    setVisible(true)
                } else if (diff > 6) {
                    setVisible(false)
                    setIsOpen(false)
                } else if (diff < -6) {
                    setVisible(true)
                }
                lastScrollY.current = currentY
                ticking.current = false
            })
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isLinkActive = (href: string) => {
        if (href === '/#' || href === '/') return pathname === '/'
        if (href.startsWith('/#')) return false // Hash links are not "active" based on pathname
        return pathname === href
    }

    return (
        <motion.div
            animate={{ y: visible ? 0 : '-100%' }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
                "fixed top-0 left-0 w-full z-50 flex justify-center",
                scrolled ? 'bg-white/95 backdrop-blur shadow-lg' : 'bg-white backdrop-blur'
            )}
            style={{ pointerEvents: visible ? 'auto' : 'none' }}
        >
            <motion.header
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className={cn(
                    "h-20 px-4 md:px-6 lg:px-8 flex-1 max-w-7xl overflow-visible",
                    scrolled ? 'border-b border-white/20' : ''
                )}
            >
                <div className="h-full flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-1">
                        <AfroTixLogo className="h-10 w-auto hidden sm:block" />
                        <AfroTixLogo className="h-8 w-auto block sm:hidden" />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-8">
                        {navigationLinks.map((link) => (
                            <NavLink
                                key={link.href}
                                href={link.href}
                                label={link.label}
                                active={isLinkActive(link.href)}
                                scrolled={scrolled}
                            />
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/auth/login"
                            className="hidden sm:flex rounded-none px-6 py-2.5 font-bold text-sm items-center gap-2 shadow-sm transition-all duration-300 bg-sepia text-white hover:bg-sepia/90"
                        >
                            {signInText}
                        </Link>
                        <Link
                            href="/promoter"
                            className="hidden md:flex rounded-none border-2 px-6 py-2 font-bold text-sm items-center gap-2 transition-all duration-300 border-sepia text-sepia hover:bg-sepia hover:text-white"
                        >
                            {ctaText}
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className={cn(
                                "lg:hidden p-2 rounded-lg transition-colors focus:outline-none",
                                scrolled ? 'text-sepia hover:bg-sepia/10' : ''
                            )}
                            aria-label="Toggle Menu"
                        >
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            key="mobile-menu"
                            initial={{ opacity: 0, scaleY: 0.95 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0.95 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            style={{ transformOrigin: 'top' }}
                            className={cn(
                                "lg:hidden absolute top-full left-0 w-full shadow-2xl",
                                scrolled ? 'bg-white border-t border-gray-100' : 'bg-black border-t border-white/10'
                            )}
                        >
                            <div className="flex flex-col p-8 gap-6">
                                {navigationLinks.map((link) => {
                                    const isActive = isLinkActive(link.href)
                                    let linkClass = 'text-white hover:text-sepia'
                                    if (isActive) {
                                        linkClass = 'text-sepia'
                                    } else if (scrolled) {
                                        linkClass = 'text-gray-800 hover:text-sepia'
                                    }
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "text-xl font-bold tracking-tight transition-colors",
                                                linkClass
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    )
                                })}
                                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full bg-sepia text-white px-6 py-4 rounded-none font-bold text-center flex items-center justify-center gap-2 shadow-lg hover:bg-sepia/90 transition-colors"
                                    >
                                        {signInText}
                                    </Link>
                                    <Link
                                        href="/promoter"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full border-2 border-sepia text-sepia px-6 py-4 rounded-none font-bold text-center flex items-center justify-center gap-2 hover:bg-sepia hover:text-white transition-colors"
                                    >
                                        {ctaText} <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>
        </motion.div>
    )
}

Navbar.displayName = "Navbar"

export default Navbar