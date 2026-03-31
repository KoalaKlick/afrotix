/**
 * Step 4: Payout Details
 * Review Platform Fees.
 * No plan selection — Essential plan only.
 */

"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Smartphone, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import {
    OnboardingCard,
    OnboardingActions,
    setupPrimaryButtonClassName,
} from "./OnboardingCard";
import { saveOnboardingStep4 } from "@/lib/actions/onboarding";
import { PLATFORM_FEES, CASHOUT_CONFIG, PAYSTACK_CONFIG } from "@/lib/const/pricing";
import { cn } from "@/lib/utils";

interface Step4PricingProps {
    readonly defaultMomoNumber?: string;
    readonly defaultMomoNetwork?: string;
    readonly onSuccess?: () => void;
}

export function Step4Pricing({
    onSuccess,
}: Readonly<Step4PricingProps>) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            formData.set("pricingPlan", "essential"); // Always essential
            
            const result = await saveOnboardingStep4(formData);
            if (result.success) {
                onSuccess?.();
                return;
            }
            setError(result.error ?? "Something went wrong");
        });
    }

    return (
        <OnboardingCard>
            <form action={handleSubmit} className="space-y-6">
                {/* Fee Summary */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold">Platform Fees</label>
                    <div className="p-4 rounded-2xl border-2 border-[#009A44] bg-[#009A44]/5">
                        <div className="flex items-center gap-2 mb-3">
                            <Banknote className="h-5 w-5 text-[#009A44]" />
                            <h4 className="font-black uppercase tracking-tight text-sm">Essential Plan</h4>
                            <span className="ml-auto text-xs font-bold text-[#009A44] bg-[#009A44]/10 px-2 py-0.5 rounded-full">Free</span>
                        </div>
                        <div className="space-y-2">
                            {(Object.entries(PLATFORM_FEES) as [string, typeof PLATFORM_FEES.vote][]).map(
                                ([type, config]) => (
                                    <div key={type} className="flex justify-between text-xs font-semibold">
                                        <span className="capitalize">{type} Fee</span>
                                        <span className="text-[#009A44]">{config.label}</span>
                                    </div>
                                )
                            )}
                            <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                                <span>Payouts</span>
                                <span>{CASHOUT_CONFIG.settlementLabel}</span>
                            </div>
                        </div>
                    </div>
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
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Completing Setup...
                            </>
                        ) : (
                            "Finish Onboarding"
                        )}
                    </Button>
                </OnboardingActions>
            </form>
        </OnboardingCard>
    );
}
