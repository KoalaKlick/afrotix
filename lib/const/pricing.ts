// ─── Afrotix Platform Pricing Constants ──────────────────────────────────────
// Single source of truth for all fees, rates, and purchasable bundles.
// Used by: frontend components, server actions, edge functions (via copy).
// ──────────────────────────────────────────────────────────────────────────────

// ─── Currency ────────────────────────────────────────────────────────────────

export const DEFAULT_CURRENCY = "GHS" as const;
export const SUBUNIT_MULTIPLIER = 100; // 1 GHS = 100 pesewas

/** Convert a major-unit amount (e.g. GHS 10) to Paystack subunits (pesewas) */
export function toPesewas(amount: number): number {
    return Math.round(amount * SUBUNIT_MULTIPLIER);
}

/** Convert Paystack subunits (pesewas) back to major-unit (GHS) */
export function fromPesewas(pesewas: number): number {
    return pesewas / SUBUNIT_MULTIPLIER;
}

// ─── Platform Fee Structure (Essential Plan Only) ────────────────────────────
// All percentages expressed as decimals (e.g. 0.035 = 3.5%)

export const PLATFORM_FEES = {
    /** Fee applied to each vote transaction */
    vote: {
        percentage: 0.054,    // 3.5%
        fixed: 0,             // GHS 0 fixed fee per vote
        label: "3.5%",
        description: "Platform service fee on voting transactions",
    },

    /** Fee applied to each nomination transaction (public nomination by voters) */
    nomination: {
        percentage: 0.054,    // 3.5%
        fixed: 0,             // GHS 0 fixed fee per nomination
        label: "3.5%",
        description: "Platform service fee on nomination transactions",
    },

    /** Fee applied to each ticket purchase */
    ticket: {
        percentage: 0.054,    // 3.5%
        fixed: 1.0,           // GHS 1.00 fixed fee per ticket
        label: "3.5% + GHS 1",
        description: "Platform service fee on ticket sales",
    },
} as const;

export type TransactionType = keyof typeof PLATFORM_FEES;

// ─── Paystack Configuration ─────────────────────────────────────────────────

export const PAYSTACK_CONFIG = {
    /** Paystack's own processing fee (informational — Paystack deducts this automatically) */
    transactionFeePercentage: 0.0195,   // 1.95%
    transactionFeeCap: 200,             // GHS 200 max per txn (Paystack caps it)

    /**
     * Who pays the Paystack transaction processing fee.
     * "subaccount" = organizer's split absorbs it (platform keeps full commission)
     * "account"    = platform absorbs it
     */
    bearer: "subaccount" as const,

    /** Default currency for Ghana market */
    currency: DEFAULT_CURRENCY,

    /** Supported mobile money networks (Ghana) */
    momoNetworks: [
        { code: "MTN", label: "MTN MoMo" },
        { code: "VOD", label: "Vodafone Cash" },
        { code: "ATL", label: "AirtelTigo Money" },
    ] as const,

    /** Supported bank networks (Ghana) */
    ghBanks: [
        { code: "006", label: "Access Bank" },
        { code: "003", label: "Absa Bank" },
        { code: "034", label: "ADB Bank" },
        { code: "090115", label: "CalBank" },
        { code: "013", label: "Ecobank" },
        { code: "061", label: "Fidelity Bank" },
        { code: "112", label: "GCB Bank" },
        { code: "068", label: "Standard Chartered" },
        { code: "284", label: "Stanbic Bank" },
        { code: "020", label: "Zenith Bank" },
        { code: "011", label: "First National Bank" }
    ] as const,

    /** Legacy bank code mapping */
    bankCodes: {
        MTN: "MTN",
        VOD: "VOD",
        ATL: "ATL",
    } as const,
} as const;

export type MomoNetwork = typeof PAYSTACK_CONFIG.momoNetworks[number]["code"];
export type GhBank = typeof PAYSTACK_CONFIG.ghBanks[number]["code"];

// ─── Communication Bundles ──────────────────────────────────────────────────
// Organizers purchase these to send SMS/WhatsApp notifications

export const COMMUNICATION_CREDITS = {
    /** Cost per channel (in credits) */
    perMessage: {
        sms:      1.0,    // 1 credit per SMS
        whatsapp: 1.5,    // 1.5 credits per WhatsApp message
        email:    0,      // Free
        inApp:    0,      // Free
    },

    /** Purchasable bundles */
    bundles: [
        {
            id: "starter",
            name: "Starter",
            credits: 100,
            price: 10,       // GHS 10
            pricePerCredit: 0.10,
            popular: false,
        },
        {
            id: "standard",
            name: "Standard",
            credits: 500,
            price: 45,       // GHS 45 (10% discount)
            pricePerCredit: 0.09,
            popular: true,
        },
        {
            id: "premium",
            name: "Premium",
            credits: 1000,
            price: 80,       // GHS 80 (20% discount)
            pricePerCredit: 0.08,
            popular: false,
        },
        {
            id: "enterprise",
            name: "Enterprise",
            credits: 5000,
            price: 350,      // GHS 350 (30% discount)
            pricePerCredit: 0.07,
            popular: false,
        },
    ] as const,
} as const;

export type CommunicationChannel = keyof typeof COMMUNICATION_CREDITS.perMessage;
export type BundleId = typeof COMMUNICATION_CREDITS.bundles[number]["id"];

// ─── Cashout (Payout) Configuration ─────────────────────────────────────────

export const CASHOUT_CONFIG = {
    /** Paystack auto-settlement schedule (business days after transaction) */
    settlementDays: 1,               // T+1 with subaccount split
    settlementLabel: "Next business day",

    /** Minimum amount for manual withdrawal (if needed) */
    minWithdrawalAmount: 10,         // GHS 10

    /** Platform holds nothing extra — Paystack settles directly to organizer */
    autoSettlement: true,
} as const;

// ─── Referral Commission ────────────────────────────────────────────────────
// Funded from the platform's service fee — does NOT reduce organizer revenue

export const REFERRAL_CONFIG = {
    /** Standard referral reward: % of platform fee from referred org's first N events */
    standardRate: 0.10,              // 10%
    standardEventsCount: 3,          // First 3 events

    /** Gold tier: higher rate + Verified Partner badge */
    goldRate: 0.15,                  // 15%

    /** New user benefit when using a referral code */
    newUserBenefits: {
        freeCredits: 500,            // 500 free SMS/WhatsApp credits
        feeDiscount: 0.005,          // OR 0.5% fee discount (first month)
    },
} as const;

// ─── Fee Calculator ─────────────────────────────────────────────────────────
// Pure functions — usable in both client and server contexts

export interface FeeBreakdown {
    /** Original transaction amount in GHS */
    amount: number;
    /** Type of transaction */
    type: TransactionType;
    /** Platform fee percentage applied */
    feePercentage: number;
    /** Platform percentage fee component (amount × percentage) */
    percentageFee: number;
    /** Platform fixed fee component */
    fixedFee: number;
    /** Total platform fee (percentage + fixed) */
    totalPlatformFee: number;
    /** What the organizer receives after platform fee */
    organizerReceives: number;
    /** Currency code */
    currency: string;
    /**
     * Paystack subaccount `percentage_charge` to use when initializing transaction.
     * Expressed as a percentage number (e.g. 3.5 for 3.5%).
     */
    paystackPercentageCharge: number;
    /**
     * Paystack `transaction_charge` flat fee to add (in pesewas).
     * Only used for ticket transactions with a fixed component.
     * Set to 0 for votes/nominations.
     */
    paystackFlatChargePesewas: number;
}

/**
 * Calculate the platform fee breakdown for a transaction.
 * 
 * @param amount - Transaction amount in GHS
 * @param type   - "vote" | "nomination" | "ticket"
 * @returns Full fee breakdown
 * 
 * @example
 * ```ts
 * const breakdown = calculateFee(100, "ticket");
 * // breakdown.totalPlatformFee = 4.50  (3.5% of 100 + GHS 1)
 * // breakdown.organizerReceives = 95.50
 * ```
 */
export function calculateFee(amount: number, type: TransactionType): FeeBreakdown {
    const config = PLATFORM_FEES[type];
    const percentageFee = amount * config.percentage;
    const totalPlatformFee = percentageFee + config.fixed;

    return {
        amount,
        type,
        feePercentage: config.percentage,
        percentageFee: round2(percentageFee),
        fixedFee: config.fixed,
        totalPlatformFee: round2(totalPlatformFee),
        organizerReceives: round2(amount - totalPlatformFee),
        currency: DEFAULT_CURRENCY,
        // Paystack uses percentage as a whole number (3.5 not 0.035)
        paystackPercentageCharge: config.percentage * 100,
        paystackFlatChargePesewas: toPesewas(config.fixed),
    };
}

/**
 * Calculate how many credits a delivery will cost.
 * Returns 0 for free channels (email, in-app).
 */
export function getDeliveryCreditCost(channel: CommunicationChannel): number {
    return COMMUNICATION_CREDITS.perMessage[channel];
}

/**
 * Check if credits balance is sufficient for a delivery.
 */
export function hasEnoughCredits(
    balance: number,
    channel: CommunicationChannel,
    messageCount = 1
): boolean {
    return balance >= getDeliveryCreditCost(channel) * messageCount;
}

// ─── Legacy Compatibility ───────────────────────────────────────────────────
// Keep the old shape so existing imports don't break during migration.
// Remove once all consumers are updated.

/** @deprecated Use `PLATFORM_FEES` + `calculateFee()` instead */
export const PRICING_PLANS = {
    essential: {
        name: "Essential",
        subtitle: "Pay-As-You-Go",
        subscription: 0,
        feePercentage: PLATFORM_FEES.ticket.percentage,
        fixedFee: PLATFORM_FEES.ticket.fixed,
        payoutSpeed: CASHOUT_CONFIG.settlementLabel,
        bestFor: "All events — voting, ticketing, and nominations",
    },
} as const;

/** @deprecated Use `TransactionType` instead */
export type PricingPlan = "essential";

// ─── Internal Helpers ───────────────────────────────────────────────────────

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}
