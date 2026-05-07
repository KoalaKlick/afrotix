import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventInfoPillProps {
    icon: LucideIcon
    label: string
    value: React.ReactNode
    className?: string
    valueClassName?: string
}

export function EventInfoPill({ 
    icon: Icon, 
    label, 
    value, 
    className, 
    valueClassName 
}: EventInfoPillProps) {
    return (
        <div className={cn(
            "flex items-center gap-0.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white", 
            className
        )}>
            <Icon className="w-3.5 h-3.5 text-brand-secondary" />
            <div className="flex items-center gap-2 justify-center">
                <span className="text-[9px] uppercase font-bold text-secondary leading-none mb-0.5">
                    {label}
                </span>
                <span className={cn("text-xs font-bold leading-none", valueClassName)}>
                    {value}
                </span>
            </div>
        </div>
    )
}
