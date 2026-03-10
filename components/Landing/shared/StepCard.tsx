import { cn } from '@/lib/utils'

export interface StepCardProps {
    readonly step: number
    readonly title: string
    readonly description: string
    readonly className?: string
    readonly numberClassName?: string
    readonly dotClassName?: string
    readonly isLast?: boolean
}

export function StepCard({
    step,
    title,
    description,
    className,
    numberClassName,
    dotClassName,
    isLast = false,
}: StepCardProps) {
    return (
        <div className={cn("relative flex items-start  gap-6", className)}>
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
                <div className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0",
                    dotClassName
                )} />
                {!isLast && (
                    <div className="w-px h-full bg-gray-200 min-h-[120px]" />
                )}
            </div>

            {/* Step number */}
            <div className={cn(
                "text-8xl font-bold opacity-20 leading-none select-none",
                numberClassName
            )}>
                {String(step).padStart(2, '0')}
            </div>

            {/* Content */}
            <div className="pt-4 pb-8">
                <h3 className="text-xl font-bold uppercase tracking-wide mb-2">{title}</h3>
                <p className="text-sm text-gray-500 max-w-xs">{description}</p>
            </div>
        </div>
    )
}
