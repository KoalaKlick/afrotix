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
        <div className="w-full">
            {/* Progress bar */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
            </div>

            {/* Step indicators */}
            <div className="flex justify-between">
                {stepLabels.map((label, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div
                            key={label}
                            className={cn("flex flex-col items-center gap-1 text-center", {
                                "opacity-40": index > currentStep,
                            })}
                        >
                            <div
                                className={cn(
                                    "flex size-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                                    {
                                        "border-primary bg-primary text-primary-foreground": isCurrent,
                                        "border-primary bg-primary/10 text-primary": isCompleted,
                                        "border-muted-foreground/30 text-muted-foreground": !isCurrent && !isCompleted,
                                    }
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className="size-4" />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span
                                className={cn("text-xs", {
                                    "font-medium text-foreground": isCurrent,
                                    "text-muted-foreground": !isCurrent,
                                })}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
