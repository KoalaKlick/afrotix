"use client"

import { useEffect } from "react"
import { AppErrorState } from "@/components/shared/AppErrorState"

type ErrorPageProps = Readonly<{
    error: Error & { digest?: string }
    reset: () => void
}>

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return <AppErrorState error={error} reset={reset} />
}