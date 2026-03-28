"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PRICING_PLANS, type FeeBreakdown, type PricingPlan } from "@/lib/const/pricing";

// ─── Fee Calculation ─────────────────────────────────────────────────────────

export async function calculateServiceFee(
    amount: number,
    plan: PricingPlan = "essential"
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
    plan: PricingPlan
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
