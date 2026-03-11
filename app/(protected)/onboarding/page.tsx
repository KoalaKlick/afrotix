"use client";

import { useState } from "react";

import {
    OnboardingProgress,
    Step1Welcome,
    Step2Avatar,
    Step3Referral,
    OnboardingComplete,
} from "@/components/onboarding";

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [userName] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    // Move to next step
    function handleStep1Success() {
        setCurrentStep(1);
    }

    function handleStep2Success() {
        setCurrentStep(2);
    }

    function handleStep3Success() {
        setIsComplete(true);
    }

    function handleStep2Skip() {
        setCurrentStep(2);
    }

    function handleStep3Skip() {
        setIsComplete(true);
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
                Step {currentStep + 1} of 3
            </p>
        </>
    );
}
