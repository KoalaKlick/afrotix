/**
 * Onboarding Complete Component
 * Shows success message and redirects to dashboard
 */

"use client";

import { useRouter } from "next/navigation";
import { PartyPopper, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    OnboardingCard,
    OnboardingHeader,
    OnboardingActions,
} from "./OnboardingCard";

interface OnboardingCompleteProps {
    userName?: string;
}

export function OnboardingComplete({ userName }: OnboardingCompleteProps) {
    const router = useRouter();

    function handleContinue() {
        router.push("/dashboard");
    }

    return (
        <OnboardingCard>
            <OnboardingHeader
                title="You're All Set!"
                description={
                    userName
                        ? `Welcome aboard, ${userName}! Your profile is ready.`
                        : "Welcome aboard! Your profile is ready."
                }
                icon={<PartyPopper className="h-6 w-6 text-primary" />}
            />

            <div className="text-center py-4">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                    <PartyPopper className="h-10 w-10 text-primary animate-bounce" />
                    <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500 animate-pulse" />
                    <Sparkles className="absolute -bottom-1 -left-1 h-4 w-4 text-yellow-500 animate-pulse delay-150" />
                </div>
                <p className="text-sm text-muted-foreground">
                    Start exploring events, vote for your favorites, and connect with the community!
                </p>
            </div>

            <OnboardingActions>
                <Button
                    size="lg"
                    className="w-full"
                    onClick={handleContinue}
                >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </OnboardingActions>
        </OnboardingCard>
    );
}
