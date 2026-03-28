"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

// ─── Fee Calculation ─────────────────────────────────────────────────────────

export type FeeBreakdown = {
    amount: number;
    plan: "essential" | "professional";
    feePercentage: number;
    percentageFee: number;
    fixedFee: number;
    totalFee: number;
    organizerReceives: number;
    currency: string;
};

export async function calculateServiceFee(
    amount: number,
    plan: "essential" | "professional" = "essential"
): Promise<FeeBreakdown> {
    const config = PRICING_PLANS[plan];
    const percentageFee = amount * config.feePercentage;
    const totalFee = percentageFee + config.fixedFee;

    return {
        amount,
        plan,
        feePercentage: config.feePercentage,
        percentageFee: Math.round(percentageFee * 100) / 100,
        fixedFee: config.fixedFee,
        totalFee: Math.round(totalFee * 100) / 100,
        organizerReceives: Math.round((amount - totalFee) * 100) / 100,
        currency: "GHS",
    };
}

// ─── Plan Management ─────────────────────────────────────────────────────────

export async function updatePricingPlan(
    plan: "essential" | "professional"
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Not authenticated" };

        await prisma.profile.update({
            where: { id: user.id },
            data: { pricingPlan: plan },
        });

        revalidatePath("/my-events");
        revalidatePath("/organization/manage");

        return { success: true };
    } catch (error) {
        console.error("[Payment] Error updating pricing plan:", error);
        return { success: false, error: "Failed to update plan" };
    }
}

// ─── Profile Payment Info ────────────────────────────────────────────────────

export async function getProfilePaymentInfo(userId: string) {
    try {
        const profile = await prisma.profile.findUnique({
            where: { id: userId },
            select: {
                pricingPlan: true,
                communicationCredits: true,
                isVerifiedPartner: true,
                momoNumber: true,
                momoNetwork: true,
            },
        });

        return profile;
    } catch (error) {
        console.error("[Payment] Error fetching payment info:", error);
        return null;
    }
}
