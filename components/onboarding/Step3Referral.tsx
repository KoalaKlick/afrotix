/**
 * Step 3: Referral - Apply Referral Code
 * Optional step to apply a referral code
 */

"use client";

import { useState, useTransition } from "react";
import { Gift, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import {
    OnboardingCard,
    OnboardingActions,
    setupPrimaryButtonClassName,
    setupTextButtonClassName,
} from "./OnboardingCard";
import {
    saveOnboardingStep3,
    skipOnboardingStep,
} from "@/lib/actions/onboarding";

interface Step3ReferralProps {
    defaultReferralCode?: string;
    onSuccess?: () => void;
    onSkip?: () => void;
}

export function Step3Referral({
    defaultReferralCode,
    onSuccess,
    onSkip,
}: Readonly<Step3ReferralProps>) {
    const [isPending, startTransition] = useTransition();
    const [referralCode, setReferralCode] = useState(defaultReferralCode ?? "");
    const [error, setError] = useState<string | null>(null);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setValidationMessage(null);

        startTransition(async () => {
            const result = await saveOnboardingStep3(formData);
            if (result.success) {
                onSuccess?.();
                return;
            }

            setError(result.error ?? "Something went wrong");
        });
    }

    async function handleSkip() {
        startTransition(async () => {
            const result = await skipOnboardingStep(2);
            if (result.success) {
                onSkip?.();
                return;
            }

            setError(result.error ?? "Something went wrong");
        });
    }

    const submitLabel = referralCode ? "Apply & Continue" : "Continue";

    return (
        <OnboardingCard>
            <form action={handleSubmit}>
                <div className="space-y-4">
                    <FormField
                        label="Referral Code"
                        name="referralCode"
                        type="text"
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        error={error ?? undefined}
                        hint="Leave empty if you don't have one"
                        icon={<Gift className="h-4 w-4" />}
                    />

                    {validationMessage && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <Check className="h-4 w-4" />
                            {validationMessage}
                        </div>
                    )}
                </div>

                <OnboardingActions>
                    <Button
                        type="submit"
                        size="lg"
                        className={setupPrimaryButtonClassName}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            submitLabel
                        )}
                    </Button>
                    {referralCode && (
                        <Button
                            type="button"
                            variant="ghost"
                            className={setupTextButtonClassName}
                            onClick={handleSkip}
                            disabled={isPending}
                        >
                            Continue without applying
                        </Button>
                    )}
                </OnboardingActions>
            </form>

            {/* Benefits info */}
            <div className="mt-6 rounded-2xl bg-red-500/5 p-4 ring-1 ring-yellow-500/30">
                <h4 className="text-sm font-medium mb-2">Why use a referral code?</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Support the person who referred you</li>
                    <li>• They earn rewards for bringing you here</li>
                    <li>• It's a great way to say thanks!</li>
                </ul>
            </div>
        </OnboardingCard>
    );
}
