/**
 * Event Creation Progress Component
 * Shows the current step in the event creation flow
 */

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCreationProgressProps {
    readonly currentStep: number;
    readonly totalSteps: number;
}

const stepLabels = ["Basic Info", "Date & Location", "Media & Settings", "Extras"];

export function EventCreationProgress({ currentStep, totalSteps }: EventCreationProgressProps) {
    return (
        <div className="w-full mb-2">
            {/* Progress bar with Pan-African colors */}
            <div className="relative h-2.5 bg-muted rounded-full overflow-hidden mb-6 flex group">
                <div 
                    className="h-full bg-primary-600 transition-all duration-500 ease-in-out relative z-30"
                    style={{ width: `${Math.min(33.33, ((currentStep + 1) / totalSteps) * 100)}%` }}
                />
                <div 
                    className="h-full bg-secondary-400 transition-all duration-500 ease-in-out relative z-20"
                    style={{ width: `${Math.max(0, Math.min(33.33, (((currentStep + 1) / totalSteps) * 100) - 33.33))}%` }}
                />
                <div 
                    className="h-full bg-tertiary-600 transition-all duration-500 ease-in-out relative z-10"
                    style={{ width: `${Math.max(0, (((currentStep + 1) / totalSteps) * 100) - 66.66)}%` }}
                />
            </div>

            {/* Step indicators */}
            <div className="flex justify-between items-start px-1">
                {stepLabels.map((label, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div
                            key={label}
                            className={cn("flex flex-col items-center gap-2 text-center relative", {
                                "opacity-40": index > currentStep,
                            })}
                        >
                            <div
                                className={cn(
                                    "flex size-10 items-center justify-center rounded-xl border-2 text-xs font-black uppercase tracking-tighter transition-all duration-300 shadow-sm",
                                    {
                                        "border-primary-600 bg-primary-600 text-white scale-110 shadow-primary-200": isCurrent,
                                        "border-primary-600 bg-primary-50 text-primary-700": isCompleted,
                                        "border-muted bg-muted/20 text-muted-foreground": !isCurrent && !isCompleted,
                                    }
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="size-5" />
                                ) : (
                                    `0${index + 1}`
                                )}
                            </div>
                            <div className="flex flex-col gap-0.5 max-w-[80px]">
                                <span
                                    className={cn("text-[10px] uppercase font-black tracking-widest leading-tight", {
                                        "text-primary-700": isCurrent || isCompleted,
                                        "text-muted-foreground/60": !isCurrent && !isCompleted,
                                    })}
                                >
                                    {label.split(' ')[0]}
                                </span>
                                <span className="text-[9px] font-medium text-muted-foreground/60 leading-none">
                                    {label.split(' ').slice(1).join(' ')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
