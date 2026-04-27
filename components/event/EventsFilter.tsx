"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { useCallback, useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

const EVENT_TYPES = [
    { label: "All", value: "" },
    { label: "Voting", value: "voting" },
    { label: "Ticketed", value: "ticketed" },
    { label: "Standard", value: "standard" },
    { label: "Hybrid", value: "hybrid" },
]

export function EventsFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get("q") ?? "")
    const activeType = searchParams.get("type") ?? ""

    const debouncedSearch = useDebounce(search, 500)

    const createQueryString = useCallback(
        (params: Record<string, string | null>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString())

            for (const [key, value] of Object.entries(params)) {
                if (value === null || value === "") {
                    newSearchParams.delete(key)
                } else {
                    newSearchParams.set(key, value)
                }
            }

            return newSearchParams.toString()
        },
        [searchParams]
    )

    useEffect(() => {
        const query = createQueryString({ q: debouncedSearch })
        const currentQuery = searchParams.toString()

        // Only push if the query has actually changed to prevent infinite loops
        if (query !== currentQuery) {
            router.push(`/events${query ? `?${query}` : ""}`, { scroll: false })
        }
    }, [debouncedSearch, createQueryString, router, searchParams])

    const handleTypeChange = (type: string) => {
        const query = createQueryString({ type })
        router.push(`/events${query ? `?${query}` : ""}`, { scroll: false })
    }

    const clearSearch = () => {
        setSearch("")
    }

    return (
        <div className="space-y-6 mb-12">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-white rounded-xl border-[#E5E5E5] focus-visible:ring-[#009A44]"
                />
                {search && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((type) => (
                    <button
                        key={type.value}
                        onClick={() => handleTypeChange(type.value)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all",
                            activeType === type.value
                                ? "bg-[#009A44] text-white shadow-sm"
                                : "bg-white text-muted-foreground hover:bg-[#F8F7F1] border border-[#E5E5E5]"
                        )}
                    >
                        {type.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
