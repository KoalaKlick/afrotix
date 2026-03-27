"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PROJ_NAME } from "@/lib/const/branding";

type AppErrorStateProps = Readonly<{
    error: Error & { digest?: string }
    reset?: () => void
    fullPage?: boolean
}>

function isLikelyNetworkError(message: string) {
    const normalized = message.toLowerCase()

    return [
        "failed to fetch",
        "networkerror",
        "network request failed",
        "load failed",
        "fetch failed",
        "chunkloaderror",
        "loading chunk",
        "failed to load module script",
        "importing a module script failed",
        "failed to fetch dynamically imported module",
    ].some((needle) => normalized.includes(needle))
}

export function AppErrorState({
    error,
    reset,
    fullPage = false,
}: AppErrorStateProps) {
    const [isOffline, setIsOffline] = useState(false)

    useEffect(() => {
        const syncStatus = () => {
            setIsOffline(typeof navigator !== "undefined" && !navigator.onLine)
        }

        syncStatus()

        globalThis.addEventListener("online", syncStatus)
        globalThis.addEventListener("offline", syncStatus)

        return () => {
            globalThis.removeEventListener("online", syncStatus)
            globalThis.removeEventListener("offline", syncStatus)
        }
    }, [])

    const details = useMemo(() => {
        const message = error.message || "Unknown error"
        const networkError = isOffline || isLikelyNetworkError(message)

        if (networkError) {
            return {
                title: isOffline ? "You appear to be offline" : "The connection was interrupted",
                description:
                    `${PROJ_NAME} could not load the data needed for this page. Check your internet connection and try again.`,
                icon: WifiOff,
            }
        }

        return {
            title: "Something went wrong while loading this page",
            description:
                "An unexpected client error interrupted rendering. Try again, or reload if the problem persists.",
            icon: AlertTriangle,
        }
    }, [error.message, isOffline])

    const Icon = details.icon
    const containerClassName = fullPage
        ? "min-h-screen bg-background text-foreground"
        : "min-h-[60vh] bg-background text-foreground"
    const innerClassName = fullPage
        ? "relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16"
        : "relative flex min-h-[60vh] items-center justify-center overflow-hidden px-6 py-16"

    return (
        <div className={containerClassName}>
            <div className={innerClassName}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_30%)]" />
                <div className="relative w-full max-w-xl rounded-3xl border border-border/70 bg-card/90 p-8 shadow-2xl backdrop-blur">
                    <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                        <Icon className="size-7" />
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-balance">
                        {details.title}
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                        {details.description}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        {reset ? (
                            <Button onClick={reset} size="lg" className="gap-2">
                                <RefreshCw className="size-4" />
                                Try again
                            </Button>
                        ) : null}

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => globalThis.location.reload()}
                        >
                            Reload page
                        </Button>
                    </div>

                    {!isOffline && error.digest ? (
                        <p className="mt-6 text-xs text-muted-foreground">
                            Reference: {error.digest}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    )
}