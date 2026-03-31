"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
    calculateFee,
    type FeeBreakdown,
    type TransactionType,
    PAYSTACK_CONFIG,
} from "@/lib/const/pricing";

// ─── Fee Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate platform service fee for a transaction.
 * Uses the unified PLATFORM_FEES constants — no plan switching.
 */
export async function calculateServiceFee(
    amount: number,
    type: TransactionType = "ticket"
): Promise<FeeBreakdown> {
    return calculateFee(amount, type);
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

// ─── Cashout Account Management ──────────────────────────────────────────────

/**
 * Update the organizer's MoMo cashout details.
 * If the organization already has a Paystack subaccount, update it there too.
 */
export async function updateCashoutAccount(data: {
    momoNumber: string;
    momoNetwork: string;
    organizationId?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Not authenticated" };

        // 1. Update profile MoMo details
        await prisma.profile.update({
            where: { id: user.id },
            data: {
                momoNumber: data.momoNumber,
                momoNetwork: data.momoNetwork,
            },
        });

        // 2. If organization has a subaccount, trigger update on Paystack
        // This will be handled by the edge function `update-subaccount`
        // when we add subaccount_code to the organizations table
        if (data.organizationId) {
            console.info(
                `[Payment] Cashout account updated for org ${data.organizationId}. ` +
                `Subaccount update will be triggered when subaccount fields are added.`
            );
        }

        revalidatePath("/my-events");
        revalidatePath("/organization/manage");

        return { success: true };
    } catch (error) {
        console.error("[Payment] Error updating cashout account:", error);
        return { success: false, error: "Failed to update cashout details" };
    }
}

// ─── Communication Credit Purchase ──────────────────────────────────────────

/**
 * Purchase a communication credit bundle.
 * Creates a payment via the initiate-payment edge function.
 * Credits are added after successful webhook confirmation.
 */
export async function purchaseCommunicationBundle(bundleId: string) {
    // This will be implemented when the bundle purchase UI is built
    // For now, return a placeholder
    console.info(`[Payment] Bundle purchase requested: ${bundleId}`);
    return { success: false, error: "Bundle purchases coming soon" };
}
