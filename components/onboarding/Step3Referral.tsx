/**
 * Step 3: Referral - Apply Referral Code
 * Optional step to apply a referral code
 */

"use client";

import { useState, useTransition } from "react";
import { Gift, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import {
    OnboardingCard,
    OnboardingHeader,
    OnboardingActions,
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
}: Step3ReferralProps) {
    const [isPending, startTransition] = useTransition();
    const [referralCode, setReferralCode] = useState(defaultReferralCode ?? "");
    const [error, setError] = useState<string | null>(null);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setValidationMessage(null);

        startTransition(async () => {
            const result = await saveOnboardingStep3(formData);
            if (!result.success) {
                setError(result.error ?? "Something went wrong");
            } else {
                onSuccess?.();
            }
        });
    }

    async function handleSkip() {
        startTransition(async () => {
            const result = await skipOnboardingStep(2);
            if (!result.success) {
                setError(result.error ?? "Something went wrong");
            } else {
                onSkip?.();
            }
        });
    }

    return (
        <OnboardingCard>
            <OnboardingHeader
                title="Got a Referral Code?"
                description="If someone referred you, enter their code to give them credit"
                icon={<Gift className="h-6 w-6 text-primary" />}
            />

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
                        className="w-full"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Completing...
                            </>
                        ) : referralCode ? (
                            "Apply & Finish"
                        ) : (
                            "Finish Setup"
                        )}
                    </Button>
                    {referralCode && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            className="w-full"
                            onClick={handleSkip}
                            disabled={isPending}
                        >
                            Skip without applying
                        </Button>
                    )}
                </OnboardingActions>
            </form>

            {/* Benefits info */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
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
