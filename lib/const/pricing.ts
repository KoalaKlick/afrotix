// ─── Pricing Constants ─────────────────────────────────────────────────────────

export const PRICING_PLANS = {
    essential: {
        name: "Essential",
        subtitle: "Pay-As-You-Go",
        subscription: 0,
        feePercentage: 0.035,
        fixedFee: 10,
        payoutSpeed: "3-5 days",
        bestFor: "One-off events or small meetups",
    },
    professional: {
        name: "Professional",
        subtitle: "Fixed Plan",
        subscription: 500,
        feePercentage: 0.015,
        fixedFee: 5,
        payoutSpeed: "Instant available",
        bestFor: "Recurring events and festivals",
    },
} as const;

export type PricingPlan = keyof typeof PRICING_PLANS;

export type FeeBreakdown = {
    amount: number;
    plan: PricingPlan;
    feePercentage: number;
    percentageFee: number;
    fixedFee: number;
    totalFee: number;
    organizerReceives: number;
    currency: string;
};
