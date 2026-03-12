/**
 * Organization Creation Progress Steps Component
 * Shows the current step in the organization creation flow
 */

"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ORG_CREATION_STEPS } from "@/lib/validations/organization";

interface OrgCreationProgressProps {
    currentStep: number;
    className?: string;
}

export function OrgCreationProgress({
    currentStep,
    className,
}: Readonly<OrgCreationProgressProps>) {
    return (
        <div className={cn("w-full", className)}>
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2">
                {ORG_CREATION_STEPS.map((step, index) => {
                    const isCompleted = currentStep > index;
                    const isCurrent = currentStep === index;

                    return (
                        <div key={step.id} className="flex items-center">
                            {/* Step circle */}
                            <div
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
                                    isCompleted &&
                                    "bg-emerald-500 text-white",
                                    isCurrent &&
                                    "bg-red-500/10 text-red-600 ring-2 ring-yellow-500 ring-offset-2",
                                    !isCompleted &&
                                    !isCurrent &&
                                    "bg-neutral-100 text-muted-foreground",
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    step.id
                                )}
                            </div>

                            {/* Connector line */}
                            {index < ORG_CREATION_STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        "mx-2 h-0.5 w-8 transition-all duration-300",
                                        currentStep > index
                                            ? "bg-emerald-500"
                                            : "bg-neutral-200",
                                    )}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step labels */}
            <div className="mt-3 flex justify-center">
                <p className="text-sm text-muted-foreground">
                    {ORG_CREATION_STEPS[currentStep]?.description}
                </p>
            </div>
        </div>
    );
}
