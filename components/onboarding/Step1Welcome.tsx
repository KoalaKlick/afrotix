/**
 * Step 1: Welcome - Username Selection
 * User already provided name at registration, just need username
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { AtSign, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import {
    OnboardingCard,
    OnboardingHeader,
    OnboardingActions,
} from "./OnboardingCard";
import {
    saveOnboardingStep1,
    checkUsernameAvailability,
} from "@/lib/actions/onboarding";
import { useDebounce } from "@/hooks/use-debounce";

interface Step1WelcomeProps {
    readonly defaultValues?: {
        username?: string;
    };
    readonly onSuccess?: () => void;
}

export function Step1Welcome({ defaultValues, onSuccess }: Step1WelcomeProps) {
    const [isPending, startTransition] = useTransition();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [username, setUsername] = useState(defaultValues?.username ?? "");
    const [usernameStatus, setUsernameStatus] = useState<
        "idle" | "checking" | "available" | "taken" | "invalid"
    >("idle");

    const debouncedUsername = useDebounce(username, 500);

    // Check username availability when it changes
    useEffect(() => {
        if (!debouncedUsername || debouncedUsername.length < 3) {
            setUsernameStatus("idle");
            return;
        }

        setUsernameStatus("checking");

        checkUsernameAvailability(debouncedUsername).then((result) => {
            if (result.success) {
                if (result.data?.available) {
                    setUsernameStatus("available");
                    setErrors((prev) => {
                        const { username: _, ...rest } = prev;
                        return rest;
                    });
                } else {
                    setUsernameStatus("taken");
                    setErrors((prev) => ({ ...prev, username: "Username is taken" }));
                }
            } else {
                setUsernameStatus("invalid");
                setErrors((prev) => ({ ...prev, username: result.error ?? "Invalid" }));
            }
        });
    }, [debouncedUsername]);

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await saveOnboardingStep1(formData);
            if (result.success) {
                onSuccess?.();
            } else {
                setErrors({ form: result.error ?? "Something went wrong" });
            }
        });
    }

    const usernameIcon = () => {
        switch (usernameStatus) {
            case "checking":
                return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
            case "available":
                return <Check className="h-4 w-4 text-green-500" />;
            case "taken":
            case "invalid":
                return <X className="h-4 w-4 text-destructive" />;
            default:
                return null;
        }
    };

    return (
        <OnboardingCard>
            <OnboardingHeader
                title="Choose Your Username"
                description="Pick a unique username that others can find you by."
                icon={<AtSign className="h-6 w-6 text-primary" />}
            />

            <form action={handleSubmit}>
                <div className="space-y-4">
                    <FormField
                        label="Username"
                        name="username"
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        error={errors.username}
                        hint="This will be your unique identifier"
                        icon={<AtSign className="h-4 w-4" />}
                        suffix={usernameIcon()}
                        required
                        autoFocus
                    />
                </div>

                {errors.form && (
                    <p className="mt-4 text-sm text-destructive text-center">
                        {errors.form}
                    </p>
                )}

                <OnboardingActions>
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isPending || usernameStatus === "taken" || usernameStatus === "checking"}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Continue"
                        )}
                    </Button>
                </OnboardingActions>
            </form>
        </OnboardingCard>
    );
}
