"use client"

import { useRef } from "react"
import { motion, useAnimationFrame } from "motion/react"
import { Section } from '@/components/Landing/shared/Section'
import { cn } from "@/lib/utils"
import { PROJ_NAME } from "@/lib/const/branding"

interface Testimonial {
    id: number
    quote: string
    author: string
    role: string
    avatar?: string
    rating: number
    accentColor: 'red' | 'yellow' | 'green'
}

const testimonials: Testimonial[] = [
    {
        id: 1,
        quote: "I have been using AfroTix for over a year now and it has completely transformed how we manage our events. The platform is intuitive and the support is outstanding.",
        author: "Ama Mensah",
        role: "Event Organizer",
        avatar: "/landing/g.webp",
        rating: 5,
        accentColor: "yellow",
    },
    {
        id: 2,
        quote: "The real-time analytics and voting features have made our conferences incredibly interactive. Our attendees love the seamless experience AfroTix provides.",
        author: "Kwame Asante",
        role: "Conference Director",
        avatar: "/landing/h.webp",
        rating: 5,
        accentColor: "green",
    },
    {
        id: 3,
        quote: "AfroTix made organizing our community festival seamless. The ticketing system is robust, and we saw a 60% increase in attendance this year.",
        author: "Efua Osei",
        role: "Community Manager",
        avatar: "/landing/b.webp",
        rating: 5,
        accentColor: "red",
    },
    {
        id: 4,
        quote: "Setting up events has never been easier. The dashboard gives us everything we need to track sales and engagement in real time.",
        author: "Kofi Adjei",
        role: "Marketing Lead",
        avatar: "/landing/a.webp",
        rating: 5,
        accentColor: "yellow",
    },
    {
        id: 5,
        quote: "We've hosted over 20 events using AfroTix. The platform scales beautifully whether it's 50 or 5000 attendees.",
        author: "Akua Boateng",
        role: "Event Producer",
        avatar: "/landing/c.webp",
        rating: 5,
        accentColor: "green",
    },
]

const quoteColors = {
    red: 'text-primary-600',
    yellow: 'text-secondary-500',
    green: 'text-tertiary-600',
}

const borderColors = {
    red: 'border-primary-600/20 hover:border-primary-600/40',
    yellow: 'border-secondary-500/20 hover:border-secondary-500/40',
    green: 'border-tertiary-600 hover:border-tertiary-600',
}

function TestimonialCard({ testimonial, isCenter = false }: { testimonial: Testimonial; isCenter?: boolean }) {
    return (
        <div
            className={cn(
                "flex-shrink-0 w-68 bg-white/60 backdrop-blur-md rounded-2xl p-6 border-2 transition-colors duration-300",
                borderColors[testimonial.accentColor],
                isCenter && "border-tertiary-600"
            )}
        >
            {/* Quote icon */}
            <svg
                className={cn("w-10 h-10 mb-4", quoteColors[testimonial.accentColor])}
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 6.5 10zm11 0c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 17.5 10z" />
            </svg>

            {/* Quote text */}
            <p className="text-gray-700 text-sm leading-relaxed mb-6">
                "{testimonial.quote}"
            </p>

            {/* Rating */}
            <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    <span
                        key={i}
                        className={cn(
                            "text-lg",
                            i < testimonial.rating ? "text-primary-600" : "text-gray-300"
                        )}
                    >
                        ●
                    </span>
                ))}
            </div>

            {/* Author */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: testimonial.avatar ? `url(${testimonial.avatar})` : undefined }}
                />
                <div>
                    <p className="font-semibold text-sm text-gray-900">{testimonial.author}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
            </div>
        </div>
    )
}

export function TestimonialsSection() {
    const marqueeRef = useRef<HTMLDivElement>(null)
    const xRef = useRef(0)

    useAnimationFrame(() => {
        if (!marqueeRef.current) return
        xRef.current -= 0.4
        const half = marqueeRef.current.scrollWidth / 2
        if (Math.abs(xRef.current) >= half) xRef.current = 0
        marqueeRef.current.style.transform = `translateX(${xRef.current}px)`
    })

    return (
        <Section as="section" contentClassName="py-20 mx-0" maxWidth="full" className="mx-0 px-0  overflow-clip">
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900 mb-4">
                    Trusted By Event Creators
                </h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                    See what organizers across Africa are saying about {PROJ_NAME}
                </p>
            </div>

            {/* Scrolling testimonials */}
            <div className="relative">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F8F7F1] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F8F7F1] to-transparent z-10 pointer-events-none" />

                <motion.div
                    ref={marqueeRef}
                    className="flex gap-6 w-max py-4"
                    style={{ willChange: 'transform' }}
                >
                    {/* Duplicate for seamless loop */}
                    {[...testimonials, ...testimonials].map((t, index) => {
                        const testimonial = {
                            ...t,
                            quote: t.quote.replace(/AfroTix/g, PROJ_NAME)
                        };
                        return (
                            <TestimonialCard
                                key={`${testimonial.id}-${index}`}
                                testimonial={testimonial}
                                isCenter={index % testimonials.length === 1}
                            />
                        );
                    })}
                </motion.div>
            </div>
        </Section>
    )
}