import { logger } from '@/lib/logger';
/**
 * Promoter Data Access Layer (DAL)
 * Server-side database operations for promoters
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import type { Promoter } from "@/lib/generated/prisma";

/**
 * Get promoter by referral code
 */
export const getPromoterByReferralCode = cache(
    async (referralCode: string): Promise<Promoter | null> => {
        try {
            return await prisma.promoter.findUnique({
                where: { referralCode },
            });
        } catch (error) {
            logger.error(error, "[DAL] Error fetching promoter by referral code:");
            return null;
        }
    },
);

/**
 * Validate referral code exists and promoter is active
 */
export async function validateReferralCode(referralCode: string): Promise<{
    valid: boolean;
    promoterId?: string;
    message?: string;
}> {
    try {
        const promoter = await prisma.promoter.findUnique({
            where: { referralCode },
            select: {
                id: true,
                status: true,
                user: {
                    select: { fullName: true },
                },
            },
        });

        if (!promoter) {
            return { valid: false, message: "Invalid referral code" };
        }

        if (promoter.status !== "active") {
            return { valid: false, message: "This referral code is no longer active" };
        }

        return {
            valid: true,
            promoterId: promoter.id,
            message: promoter.user.fullName
                ? `Referred by ${promoter.user.fullName}`
                : "Valid referral code",
        };
    } catch (error) {
        logger.error(error, "[DAL] Error validating referral code:");
        return { valid: false, message: "Error validating referral code" };
    }
}

/**
 * Get promoter by user ID
 */
export const getPromoterByUserId = cache(
    async (userId: string): Promise<Promoter | null> => {
        try {
            return await prisma.promoter.findUnique({
                where: { userId },
            });
        } catch (error) {
            logger.error(error, "[DAL] Error fetching promoter by user ID:");
            return null;
        }
    },
);
