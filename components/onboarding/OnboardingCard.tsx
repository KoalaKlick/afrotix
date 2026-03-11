/**
 * Onboarding Card Wrapper Component
 * Consistent styling for all onboarding steps
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface OnboardingCardProps {
    children: ReactNode;
    className?: string;
}

export function OnboardingCard({ children, className }: OnboardingCardProps) {
    return (
        <div
            className={cn(
                "w-full max-w-md mx-auto",
                "bg-card rounded-2xl border shadow-lg",
                "p-6 sm:p-8",
                className,
            )}
        >
            {children}
        </div>
    );
}

interface OnboardingHeaderProps {
    title: string;
    description?: string;
    icon?: ReactNode;
}

export function OnboardingHeader({
    title,
    description,
    icon,
}: OnboardingHeaderProps) {
    return (
        <div className="text-center mb-6">
            {icon && (
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    {icon}
                </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            )}
        </div>
    );
}

interface OnboardingActionsProps {
    children: ReactNode;
    className?: string;
}

export function OnboardingActions({
    children,
    className,
}: OnboardingActionsProps) {
    return (
        <div className={cn("mt-6 flex flex-col gap-3", className)}>{children}</div>
    );
}
