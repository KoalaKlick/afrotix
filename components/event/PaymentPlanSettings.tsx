"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Crown,
    Zap,
    Check,
    Loader2,
    Calculator,
    CreditCard,
    MessageSquare,
    Shield,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePricingPlan } from "@/lib/actions/payment";
import { PRICING_PLANS } from "@/lib/const/pricing";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentPlanSettingsProps {
    readonly currentPlan: string;
    readonly communicationCredits: number;
    readonly isVerifiedPartner: boolean;
}

const PLAN_FEATURES = {
    essential: [
        "0 GHS / month subscription",
        "3.5% + GHS 10 service fee per unit",
        "Free events always free",
        "Standard payouts (3-5 days)",
        "Best for one-off events",
    ],
    professional: [
        "500 GHS / month subscription",
        "1.5% + GHS 5 service fee per unit",
        "Free events always free",
        "Instant payouts available",
        "Best for recurring events",
    ],
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentPlanSettings({
    currentPlan,
    communicationCredits,
    isVerifiedPartner,
}: PaymentPlanSettingsProps) {
    const [previewAmount, setPreviewAmount] = useState<string>("100");
    const [isPending, startTransition] = useTransition();

    const amount = parseFloat(previewAmount) || 0;

    // Calculate fees for both plans
    const essentialFee =
        amount * PRICING_PLANS.essential.feePercentage +
        PRICING_PLANS.essential.fixedFee;
    const professionalFee =
        amount * PRICING_PLANS.professional.feePercentage +
        PRICING_PLANS.professional.fixedFee;

    function handlePlanSwitch(plan: "essential" | "professional") {
        if (plan === currentPlan) return;
        startTransition(async () => {
            await updatePricingPlan(plan);
        });
    }

    return (
        <div className="space-y-6">
            {/* ─── Plan Cards ──────────────────────────── */}
            <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5 text-[#009A44]" />
                    <h3 className="font-semibold text-lg">Pricing Plan</h3>
                    {isVerifiedPartner && (
                        <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFCD00]/10 text-[#b8960a] text-[10px] font-bold uppercase tracking-wider">
                            <Shield className="w-3 h-3" />
                            Verified Partner
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Essential Card */}
                    <button
                        type="button"
                        onClick={() => handlePlanSwitch("essential")}
                        disabled={isPending}
                        className={cn(
                            "relative flex flex-col p-5 rounded-xl border-2 text-left transition-all duration-300",
                            currentPlan === "essential"
                                ? "border-[#009A44] bg-[#009A44]/3 shadow-sm shadow-[#009A44]/10"
                                : "border-muted hover:border-muted-foreground/30"
                        )}
                    >
                        {currentPlan === "essential" && (
                            <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-[#009A44] text-white text-[9px] font-bold uppercase tracking-wider">
                                Current
                            </span>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-5 h-5 text-[#009A44]" />
                            <span className="font-bold">Essential</span>
                        </div>
                        <p className="text-2xl font-black mb-1">
                            Free
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                                / month
                            </span>
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                            Pay-as-you-go pricing
                        </p>
                        <ul className="space-y-2">
                            {PLAN_FEATURES.essential.map((f) => (
                                <li
                                    key={f}
                                    className="flex items-start gap-2 text-xs text-muted-foreground"
                                >
                                    <Check className="w-3.5 h-3.5 text-[#009A44] shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </button>

                    {/* Professional Card */}
                    <button
                        type="button"
                        onClick={() => handlePlanSwitch("professional")}
                        disabled={isPending}
                        className={cn(
                            "relative flex flex-col p-5 rounded-xl border-2 text-left transition-all duration-300",
                            currentPlan === "professional"
                                ? "border-[#FFCD00] bg-[#FFCD00]/3 shadow-sm shadow-[#FFCD00]/10"
                                : "border-muted hover:border-muted-foreground/30"
                        )}
                    >
                        {currentPlan === "professional" && (
                            <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-[#FFCD00] text-[#1a1a2e] text-[9px] font-bold uppercase tracking-wider">
                                Current
                            </span>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                            <Crown className="w-5 h-5 text-[#FFCD00]" />
                            <span className="font-bold">Professional</span>
                        </div>
                        <p className="text-2xl font-black mb-1">
                            GHS 500
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                                / month
                            </span>
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                            Fixed monthly plan
                        </p>
                        <ul className="space-y-2">
                            {PLAN_FEATURES.professional.map((f) => (
                                <li
                                    key={f}
                                    className="flex items-start gap-2 text-xs text-muted-foreground"
                                >
                                    <Check className="w-3.5 h-3.5 text-[#FFCD00] shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </button>
                </div>

                {isPending && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating plan...
                    </div>
                )}
            </div>

            {/* ─── Fee Calculator ──────────────────────── */}
            <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-[#FFCD00]" />
                    <h3 className="font-semibold">Fee Calculator</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                    Preview how fees compare between plans for a given
                    transaction amount.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm">
                            Transaction Amount (GHS)
                        </Label>
                        <Input
                            type="number"
                            value={previewAmount}
                            onChange={(e) => setPreviewAmount(e.target.value)}
                            placeholder="100"
                            min={0}
                            className="h-10"
                        />
                    </div>

                    {amount > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                className={cn(
                                    "rounded-xl p-4 border",
                                    currentPlan === "essential"
                                        ? "border-[#009A44]/20 bg-[#009A44]/3"
                                        : "border-muted"
                                )}
                            >
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    Essential
                                </p>
                                <p className="text-sm">
                                    Fee:{" "}
                                    <span className="font-bold text-red-600">
                                        GHS {essentialFee.toFixed(2)}
                                    </span>
                                </p>
                                <p className="text-sm mt-1">
                                    You receive:{" "}
                                    <span className="font-bold text-[#009A44]">
                                        GHS{" "}
                                        {(amount - essentialFee).toFixed(2)}
                                    </span>
                                </p>
                            </div>
                            <div
                                className={cn(
                                    "rounded-xl p-4 border",
                                    currentPlan === "professional"
                                        ? "border-[#FFCD00]/20 bg-[#FFCD00]/3"
                                        : "border-muted"
                                )}
                            >
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    Professional
                                </p>
                                <p className="text-sm">
                                    Fee:{" "}
                                    <span className="font-bold text-red-600">
                                        GHS {professionalFee.toFixed(2)}
                                    </span>
                                </p>
                                <p className="text-sm mt-1">
                                    You receive:{" "}
                                    <span className="font-bold text-[#009A44]">
                                        GHS{" "}
                                        {(amount - professionalFee).toFixed(2)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {amount > 0 && (
                        <p className="text-[10px] text-center text-muted-foreground">
                            You save{" "}
                            <strong className="text-[#009A44]">
                                GHS{" "}
                                {(essentialFee - professionalFee).toFixed(2)}
                            </strong>{" "}
                            per transaction on Professional
                        </p>
                    )}
                </div>
            </div>

            {/* ─── Communication Credits ──────────────── */}
            <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#CE1126]" />
                        <h3 className="font-semibold">
                            Communication Credits
                        </h3>
                    </div>
                    <span className="text-2xl font-black text-[#009A44]">
                        {communicationCredits.toFixed(0)}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                    Credits are used for SMS and WhatsApp notifications. Email
                    and in-app notifications are always free.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-xs text-muted-foreground">SMS</p>
                        <p className="text-sm font-bold mt-0.5">
                            1 credit/msg
                        </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            WhatsApp
                        </p>
                        <p className="text-sm font-bold mt-0.5">
                            1.5 credits/msg
                        </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-bold mt-0.5 text-[#009A44]">
                            Free
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Purchase Credits (Coming Soon)
                </Button>
            </div>
        </div>
    );
}
