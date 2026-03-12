"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Step1Welcome,
    Step2Avatar,
    Step3Referral,
} from "@/components/onboarding";

interface OnboardingClientProps {
    readonly initialStep: number;
}

export function OnboardingClient({
    initialStep,
}: OnboardingClientProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(initialStep);

    function handleStep1Success() {
        setCurrentStep(1);
        router.refresh();
    }

    function handleStep2Success() {
        setCurrentStep(2);
        router.refresh();
    }

    function handleStep3Success() {
        router.replace("/onboarding?completed=1");
    }

    function handleStep2Skip() {
        setCurrentStep(2);
        router.refresh();
    }

    function handleStep3Skip() {
        router.replace("/onboarding?completed=1");
    }

    return (
        <>
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
        </>
    );
}