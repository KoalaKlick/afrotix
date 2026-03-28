/**
 * Step 4: Pricing & Payments - Plan Selection & MoMo Details
 * Final mandatory step for organizers
 */

"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import {
    OnboardingCard,
    OnboardingActions,
    setupPrimaryButtonClassName,
} from "./OnboardingCard";
import { saveOnboardingStep4 } from "@/lib/actions/onboarding";
import { PRICING_PLANS, type PricingPlan } from "@/lib/const/pricing";
import { cn } from "@/lib/utils";

interface Step4PricingProps {
    readonly defaultPlan?: PricingPlan;
    readonly defaultMomoNumber?: string;
    readonly defaultMomoNetwork?: string;
    readonly onSuccess?: () => void;
}

export function Step4Pricing({
    defaultPlan = "essential",
    defaultMomoNumber = "",
    defaultMomoNetwork = "MTN",
    onSuccess,
}: Readonly<Step4PricingProps>) {
    const [isPending, startTransition] = useTransition();
    const [plan, setPlan] = useState<PricingPlan>(defaultPlan);
    const [momoNumber, setMomoNumber] = useState(defaultMomoNumber);
    const [momoNetwork, setMomoNetwork] = useState(defaultMomoNetwork);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            // Add plan and network to formData since they might not be native inputs
            formData.set("pricingPlan", plan);
            formData.set("momoNetwork", momoNetwork);
            
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
                {/* Plan Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold">Select Your Pricing Plan</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Object.entries(PRICING_PLANS) as [PricingPlan, typeof PRICING_PLANS.essential][]).map(([key, details]) => (
                            <div
                                key={key}
                                onClick={() => setPlan(key)}
                                className={cn(
                                    "relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200",
                                    plan === key 
                                        ? "border-[#009A44] bg-[#009A44]/5 shadow-sm" 
                                        : "border-muted hover:border-muted-foreground/30 bg-white"
                                )}
                            >
                                {plan === key && (
                                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#009A44] rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                <h4 className="font-black uppercase tracking-tight text-sm">{details.name}</h4>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{details.subtitle}</p>
                                <div className="mt-3 space-y-1">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span>Service Fee</span>
                                        <span className="text-[#009A44]">{(details.feePercentage * 100).toFixed(1)}% + GHS {details.fixedFee}</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-tight">{details.bestFor}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payout Details */}
                <div className="space-y-4">
                    <label className="text-sm font-semibold">Payout Account (MoMo)</label>
                    
                    <div className="p-4 rounded-2xl bg-muted/30 border border-muted-foreground/10 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {["MTN", "VODAFONE", "AT"].map((network) => (
                                <button
                                    key={network}
                                    type="button"
                                    onClick={() => setMomoNetwork(network)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                        momoNetwork === network 
                                            ? "bg-black text-white border-black shadow-lg" 
                                            : "bg-white text-muted-foreground border-muted hover:bg-muted/50"
                                    )}
                                >
                                    {network}
                                </button>
                            ))}
                        </div>

                        <FormField
                            label="MoMo Number"
                            name="momoNumber"
                            type="tel"
                            placeholder="024 000 0000"
                            value={momoNumber}
                            onChange={(e) => setMomoNumber(e.target.value.replace(/\D/g, ""))}
                            error={error ?? undefined}
                            icon={<Smartphone className="h-4 w-4" />}
                            hint="Earnings from ticket sales and votes will be sent here"
                        />
                    </div>
                </div>

                <OnboardingActions>
                    <Button
                        type="submit"
                        size="lg"
                        className={setupPrimaryButtonClassName}
                        disabled={isPending || !momoNumber || momoNumber.length < 9}
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
