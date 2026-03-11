"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    OnboardingProgress,
    Step1Welcome,
    Step2Avatar,
    Step3Referral,
    OnboardingComplete,
} from "@/components/onboarding";

interface OnboardingClientProps {
    readonly initialStep: number;
    readonly userName: string;
    readonly totalSteps: number;
}

export function OnboardingClient({
    initialStep,
    userName,
    totalSteps,
}: OnboardingClientProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [isComplete, setIsComplete] = useState(initialStep >= totalSteps);

    // Move to next step
    function handleStep1Success() {
        setCurrentStep(1);
        router.refresh(); // Refresh to persist in case of page reload
    }

    function handleStep2Success() {
        setCurrentStep(2);
        router.refresh();
    }

    function handleStep3Success() {
        setIsComplete(true);
        router.refresh();
    }

    function handleStep2Skip() {
        setCurrentStep(2);
        router.refresh();
    }

    function handleStep3Skip() {
        setIsComplete(true);
        router.refresh();
    }

    // Render complete state
    if (isComplete) {
        return <OnboardingComplete userName={userName} />;
    }

    return (
        <>
            {/* Progress Indicator */}
            <div className="mb-6">
                <OnboardingProgress currentStep={currentStep} />
            </div>

            {/* Step Components - each is self-contained */}
            {currentStep === 0 && (
                <Step1Welcome onSuccess={handleStep1Success} />
            )}

            {currentStep === 1 && (
                <Step2Avatar
                    onSuccess={handleStep2Success}
                    onSkip={handleStep2Skip}
                />
            )}

            {currentStep === 2 && (
                <Step3Referral
                    onSuccess={handleStep3Success}
                    onSkip={handleStep3Skip}
                />
            )}

            {/* Step indicator text */}
            <p className="mt-4 text-center text-sm text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
            </p>
        </>
    );
}
