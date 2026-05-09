"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { label: "All", value: "" },
  { label: "Voting", value: "voting" },
  { label: "Ticketed", value: "ticketed" },
  { label: "Standard", value: "standard" },
  { label: "Hybrid", value: "hybrid" },
];

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EventsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const activeType = searchParams.get("type") ?? "";

  const debouncedSearch = useDebounce(search, 500);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === "") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      }

      return newSearchParams.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    const query = createQueryString({ q: debouncedSearch });
    const currentQuery = searchParams.toString();

    if (query !== currentQuery) {
      router.push(`/events${query ? `?${query}` : ""}`, { scroll: false });
    }
  }, [debouncedSearch, createQueryString, router, searchParams]);

  const handleTypeChange = (value: string) => {
    const query = createQueryString({ type: value === "all" ? "" : value });
    router.push(`/events${query ? `?${query}` : ""}`, { scroll: false });
  };

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-2xl mx-auto">
      <div className="relative flex-1 group w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-[#009A44] transition-colors" />
        <Input
          placeholder="Search events by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 pr-12 py-3 bg-white/50 backdrop-blur-md border-zinc-200 focus:border-[#009A44] focus:ring-4 focus:ring-[#009A44]/10 rounded-md transition-all placeholder:text-zinc-400"
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Select value={activeType || "all"} onValueChange={handleTypeChange}>
        <SelectTrigger className="py-3 px-6 rounded-md bg-white/50 backdrop-blur-md border-zinc-200 focus:ring-[#009A44]/10 w-full sm:w-[180px] text-zinc-600 font-medium">
          <SelectValue placeholder="Event Type" />
        </SelectTrigger>
        <SelectContent>
          {EVENT_TYPES.map((type) => (
            <SelectItem key={type.value || "all"} value={type.value || "all"} className="font-medium  tracking-wider py-3">
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
