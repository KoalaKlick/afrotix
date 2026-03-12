"use client"

import { useEffect } from "react"
import { AppErrorState } from "@/components/shared/AppErrorState"
import "./globals.css"

type GlobalErrorPageProps = Readonly<{
    error: Error & { digest?: string }
    reset: () => void
}>

export default function GlobalErrorPage({
    error,
    reset,
}: GlobalErrorPageProps) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html lang="en">
            <body>
                <AppErrorState error={error} reset={reset} fullPage />
            </body>
        </html>
    )
}