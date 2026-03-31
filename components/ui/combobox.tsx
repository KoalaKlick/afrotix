"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Select...",
    disabled = false,
    className = "",
}: Readonly<ComboboxProps>) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const filtered =
        search.trim() === ""
            ? options
            : options.filter((opt) =>
                opt.label.toLowerCase().includes(search.toLowerCase())
            );

    const selected = options.find((opt) => opt.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    disabled={disabled}
                >
                    <span className={cn(!selected && "text-muted-foreground")}>{selected ? selected.label : placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-1"
                    autoFocus
                />
                <div className="max-h-56 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="px-3 py-2 text-muted-foreground text-sm">No options</div>
                    ) : (
                        filtered.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={cn(
                                    "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none",
                                    value === opt.value && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                    setSearch("");
                                }}
                            >
                                {value === opt.value && <Check className="h-4 w-4 text-primary" />}
                                <span className="truncate">{opt.label}</span>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
