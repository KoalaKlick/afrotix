"use client";

import { useState } from "react";
import {
    Calculator,
    CreditCard,
    MessageSquare,
    Shield,
    ArrowRight,
    Package,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    PLATFORM_FEES,
    COMMUNICATION_CREDITS,
    CASHOUT_CONFIG,
    calculateFee,
    type TransactionType,
} from "@/lib/const/pricing";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentPlanSettingsProps {
    readonly communicationCredits: number;
    readonly isVerifiedPartner: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentPlanSettings({
    communicationCredits,
    isVerifiedPartner,
}: PaymentPlanSettingsProps) {
    const [previewAmount, setPreviewAmount] = useState<string>("100");
    const [previewType, setPreviewType] = useState<TransactionType>("ticket");

    const amount = parseFloat(previewAmount) || 0;
    const breakdown = amount > 0 ? calculateFee(amount, previewType) : null;

    return (
        <div className="space-y-6">
            {/* ─── Essential Plan Card ──────────────────── */}
            <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5 text-[#009A44]" />
                    <h3 className="font-semibold text-lg">Platform Fees</h3>
                    {isVerifiedPartner && (
                        <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFCD00]/10 text-[#b8960a] text-[10px] font-bold uppercase tracking-wider">
                            <Shield className="w-3 h-3" />
                            Verified Partner
                        </span>
                    )}
                </div>

                <div className="rounded-xl border-2 border-[#009A44] bg-[#009A44]/3 p-5">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#009A44] text-white text-[9px] font-bold uppercase tracking-wider mb-3">
                        Essential Plan
                    </span>
                    <p className="text-2xl font-black mb-1">
                        Free
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                            / no subscription
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                        Pay-as-you-go — we only earn when you do
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(Object.entries(PLATFORM_FEES) as [TransactionType, typeof PLATFORM_FEES.vote][]).map(
                            ([type, config]) => (
                                <div
                                    key={type}
                                    className="rounded-lg bg-background/60 border p-3"
                                >
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                        {type === "vote" ? "Votes" : type === "nomination" ? "Nominations" : "Tickets"}
                                    </p>
                                    <p className="text-sm font-bold text-[#009A44]">
                                        {config.percentage * 100}% {config.fixed > 0 ? `+ GHS ${config.fixed}` : ""}
                                    </p>
                                </div>
                            )
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-[#009A44]" />
                        Payouts settle {CASHOUT_CONFIG.settlementLabel.toLowerCase()} via MoMo
                    </div>
                </div>
            </div>

            {/* ─── Fee Calculator ──────────────────────── */}
            <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-[#FFCD00]" />
                    <h3 className="font-semibold">Fee Calculator</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                    Preview how fees apply to different transaction types.
                </p>

                <div className="space-y-4">
                    {/* Transaction type selector */}
                    <div className="flex gap-2">
                        {(["vote", "nomination", "ticket"] as TransactionType[]).map((type) => (
                            <Button
                                variant={previewType === type ? "tertiary" : "outline"}
                                key={type}
                                onClick={() => setPreviewType(type)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
                                    previewType === type
                                        ? ""
                                        : ""
                                )}
                            >
                                {type}
                            </Button>
                        ))}
                    </div>

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

                    {breakdown && (
                        <div className="rounded-xl p-4 border border-[#009A44]/20 bg-[#009A44]/3">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Transaction Amount</span>
                                    <span className="font-medium">GHS {breakdown.amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Platform Fee ({breakdown.feePercentage * 100}%{breakdown.fixedFee > 0 ? ` + GHS ${breakdown.fixedFee}` : ""})
                                    </span>
                                    <span className="font-bold text-red-600">
                                        − GHS {breakdown.totalPlatformFee.toFixed(2)}
                                    </span>
                                </div>
                                <div className="border-t pt-2 flex justify-between text-sm">
                                    <span className="font-semibold">You Receive</span>
                                    <span className="font-black text-[#009A44] text-base">
                                        GHS {breakdown.organizerReceives.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
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
                            {COMMUNICATION_CREDITS.perMessage.sms} credit/msg
                        </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-xs text-muted-foreground">
                            WhatsApp
                        </p>
                        <p className="text-sm font-bold mt-0.5">
                            {COMMUNICATION_CREDITS.perMessage.whatsapp} credits/msg
                        </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-bold mt-0.5 text-[#009A44]">
                            Free
                        </p>
                    </div>
                </div>

                {/* ─── Bundle Purchase Cards ──────────────── */}
                <div className="space-y-2 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-[#FFCD00]" />
                        <h4 className="text-sm font-semibold">Purchase Bundles</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {COMMUNICATION_CREDITS.bundles.map((bundle) => (
                            <button
                                key={bundle.id}
                                type="button"
                                className={cn(
                                    "relative flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:shadow-sm",
                                    bundle.popular
                                        ? "border-[#FFCD00] bg-[#FFCD00]/5"
                                        : "border-muted hover:border-muted-foreground/30"
                                )}
                                disabled // Will be enabled when purchase flow is built
                            >
                                {bundle.popular && (
                                    <span className="absolute -top-2 px-1.5 py-0.5 rounded-full bg-[#FFCD00] text-[#1a1a2e] text-[8px] font-bold uppercase tracking-wider">
                                        Popular
                                    </span>
                                )}
                                <p className="text-lg font-black">{bundle.credits}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                    credits
                                </p>
                                <p className="text-sm font-bold text-[#009A44] mt-1">
                                    GHS {bundle.price}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    disabled
                >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Purchase Credits (Coming Soon)
                </Button>
            </div>
        </div>
    );
}
