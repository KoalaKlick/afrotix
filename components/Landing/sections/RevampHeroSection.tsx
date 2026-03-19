'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import firstImage from '@/public/landing/h.webp'
import secondImage from '@/public/landing/g.webp'
import thirdImage from '@/public/landing/l.jpg'
import AfricaImageClip from '@/components/shared/AfricaImageClip'
import { defaultNavigationLinks } from '@/lib/const/landing'
import { AfroTixLogo } from "@/components/shared/AfroTixLogo"
import { cn } from '@/lib/utils'
import PanafricanButton from '@/components/shared/PanafricanButton'

export function HeroSection() {
    const pathname = usePathname()

    const isLinkActive = (href: string) => {
        if (href === '/' || href === '/#') return pathname === '/'
        if (href.startsWith('/#')) return false
        return pathname === href
    }

    const router = useRouter()

    return (
        <section
            id="hero"
            className="font-poppins    text-black w-full overflow-hidden  h-svh min-h-fit md:max-h-[48rem] "
        >
            <div className="max-w-7xl mx-auto  px-6 flex flex-col mt-14 xs:mt-16 sm:mt-16  flex-1 md:mt-0 md:flex-row">
                <div className="flex-1  flex flex-col">

                    {/* ── Inline Navbar (desktop only) ── */}
                    <div className="hidden md:flex items-center justify-evenly @min-[1300px]:px-0 h-20 flex-shrink-0">

                        <div className="flex items-center gap-6 lg:gap-8 ">
                            <Link href="/" className="pointer-events-auto bg-secondary-50">
                                <AfroTixLogo className="w-32  h-auto" />
                            </Link>
                            {defaultNavigationLinks.map((link) => {
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
                                                layoutId="hero-nav-underline"
                                                className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#009A44]"
                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                )
                            })}
                            <Link
                                href="/auth/login"
                                className="text-sm font-medium text-nowrap text-black/70 hover:text-black transition-colors"
                            >
                                Log in
                            </Link>
                            {/* Africa map clip as CTA */}

                        </div>
                    </div>

                    {/* ── Hero text ── */}
                    <div className="flex-1 mt-12  flex flex-col justify-center">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.93] tracking-tight mb-6">
                            Create,<br />
                            Manage &amp;<br />
                            Grow events.
                        </h1>
                        <p className="text-sm sm:text-base text-black/60 max-w-xl leading-relaxed mb-8">
                            Empower your events with live voting, seamless ticket
                            sales, and powerful analytics. From community polls to
                            sold-out conferences, PanEvent makes it effortless.
                        </p>
                        <div className='space-x-4'>
                            <Link
                                href="/auth/register"
                                className="inline-flex items-center bg-[#009A44] hover:bg-[#007a36] text-white font-bold capitalize tracking-widest text-xs px-4 py-3 rounded-md transition-colors duration-200"
                            >
                                Ongoing Events
                            </Link>
                            <PanafricanButton onClick={() => router.push('/auth/register')} dashedBorderClassName="hover:opacity-90 transition-all rounded-none" dashArray='0 0' className='h-10 bg-white hover:bg-white/80   text-tertiary-700'>
                                Get Started
                            </PanafricanButton>
                        </div>
                    </div>

                </div>
                <div className="relative w-full    md:max-w-2xl  md:my-auto aspect-square max-w- mx-auto lg:mx-0">
                    {/* Top-center — largest clip */}
                    <div className="absolute w-[70%] top-[2%] left-[12%] z-20 transition-transform duration-500 hover:scale-105 hover:z-30">
                        <AfricaImageClip
                            src={secondImage}
                            alt="Second image"
                            className="w-full h-full"
                        />
                    </div>

                    {/* Bottom-right — medium clip */}
                    <div className="absolute w-[34%] bottom-[0%] right-0 z-10
                                            transition-transform duration-500 hover:scale-105 hover:z-30">
                        <AfricaImageClip
                            src={firstImage}
                            alt="First image"
                            className="w-full h-full"
                        />
                    </div>

                    {/* Bottom-left — smaller clip */}
                    <div className="absolute w-[40%] bottom-[2%] left-0 z-10
                                            transition-transform duration-500 hover:scale-105 hover:z-30">
                        <AfricaImageClip
                            src={thirdImage}
                            alt="Third image"
                            className="w-full h-full"
                        />
                    </div>
                </div>

            </div>


        </section>
    )
}