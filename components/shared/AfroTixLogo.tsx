"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useInView, useAnimation, type Variants } from "motion/react"

import { PROJ_NAME } from "@/lib/const/branding";

interface AfroTixLogoProps {
    readonly className?: string
    /** Duration (ms) the logo is held visible before exiting. Default: 2800 */
    readonly holdDuration?: number
    /** Gap (ms) between exit and next entrance. Default: 600 */
    readonly gapDuration?: number
    /** If true, animation repeats on an interval. Default: true */
    readonly repeat?: boolean
}

export function AfroTixLogo({
    className = "h-auto",
    holdDuration = 2800,
    gapDuration = 600,
    repeat = false,
}: AfroTixLogoProps) {
    const ref = useRef<SVGSVGElement>(null)
    const isInView = useInView(ref, { once: false, amount: 0.5 })
    const controls = useAnimation()
    const dotControls = useAnimation()
    const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [active, setActive] = useState(false)

    // Helper to determine how to render the name
    const isAfroTix = PROJ_NAME.toLowerCase().includes("afrotix");
    const namePart1 = isAfroTix ? "Afro" : PROJ_NAME;
    const namePart2 = isAfroTix ? "Tix" : "";

    const letterVariants: Variants = {
        hidden: { opacity: 0, y: 16 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.13,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
            },
        }),
        exit: (i: number) => ({
            opacity: 0,
            y: -14,
            transition: {
                delay: i * 0.08,
                duration: 0.38,
                ease: [0.55, 0, 0.78, 0],
            },
        }),
    }

    const dotVariants: Variants = {
        hidden: { opacity: 0, scale: 0 },
        visible: {
            opacity: 1,
            scale: [0, 1.5, 0.9, 1.15, 1],
            transition: {
                delay: 0.32,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
            },
        },
        pulse: {
            scale: [1, 1.2, 1],
            transition: {
                duration: 1.6,
                repeat: Infinity,
                repeatDelay: 2.4,
                ease: "easeInOut",
            },
        },
        exit: {
            opacity: 0,
            scale: 0,
            transition: {
                duration: 0.3,
                ease: [0.55, 0, 0.78, 0],
            },
        },
    }

    const runCycle = useCallback(async () => {
        await controls.start("visible")
        await dotControls.start("visible")
        dotControls.start("pulse") // gentle breathing pulse on the dot

        if (!repeat) return

        cycleRef.current = setTimeout(async () => {
            await dotControls.start("exit")
            await controls.start("exit")

            cycleRef.current = setTimeout(() => {
                controls.set("hidden")
                dotControls.set("hidden")
                runCycle()
            }, gapDuration)
        }, holdDuration)
    }, [controls, dotControls, repeat, holdDuration, gapDuration])

    useEffect(() => {
        if (isInView && !active) {
            setActive(true)
            controls.set("hidden")
            dotControls.set("hidden")
            runCycle()
        }

        if (!isInView && active) {
            setActive(false)
            if (cycleRef.current) clearTimeout(cycleRef.current)
            controls.set("hidden")
            dotControls.set("hidden")
        }

        return () => {
            if (cycleRef.current) clearTimeout(cycleRef.current)
        }
    }, [isInView, active, controls, dotControls, runCycle])

    return (
        <motion.svg
            ref={ref}
            className={className}
            viewBox="0 0 480 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial="hidden"
            animate={controls}
            suppressHydrationWarning
        >
            <title suppressHydrationWarning>{`${PROJ_NAME} Logo`}</title>
            <text
                y="80"
                fontFamily="'Poppins', Arial, sans-serif"
                fontSize="105"
                fontWeight="800"
                letterSpacing="-2"
                textAnchor="start"
            >
                <motion.tspan fill="#C41E3A" custom={0} variants={letterVariants}>
                    {namePart1}
                </motion.tspan>
                {namePart2 && (
                    <motion.tspan fill="#FFB800" custom={1} variants={letterVariants}>
                        {namePart2}
                    </motion.tspan>
                )}
                <motion.tspan
                    fill="#228B22"
                    variants={dotVariants}
                    animate={dotControls}
                >
                    .
                </motion.tspan>
            </text>
        </motion.svg>
    )
}
