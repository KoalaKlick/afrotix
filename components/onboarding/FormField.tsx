/**
 * Form Field Component
 * Reusable form input with label and error handling
 */

"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
    error?: string;
    hint?: string;
    icon?: ReactNode;
    suffix?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
    ({ label, name, error, hint, icon, suffix, className, value, ...props }, ref) => {
        // Ensure controlled inputs always have a defined value
        const controlledValue = value !== undefined ? value : undefined;

        return (
            <div className="space-y-2">
                <Label
                    htmlFor={name}
                    className={cn(error && "text-destructive")}
                >
                    {label}
                </Label>
                <div className="relative">
                    <Input
                        ref={ref}
                        id={name}
                        name={name}
                        icon={icon}
                        className={cn(
                            error && "border-destructive focus-visible:ring-destructive",
                            suffix && "pr-12",
                            className,
                        )}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
                        value={controlledValue}
                        {...props}
                    />
                    {suffix && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {suffix}
                        </div>
                    )}
                </div>
                {error && (
                    <p
                        id={`${name}-error`}
                        className="text-xs text-destructive"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${name}-hint`} className="text-xs text-muted-foreground">
                        {hint}
                    </p>
                )}
            </div>
        );
    },
);

FormField.displayName = "FormField";
