/**
 * Hook for Paystack Inline JS
 * Handles initializing and resuming transactions
 */

"use client";

import { useCallback } from "react";

// Use dynamic import or check for window to avoid SSR issues
// PaystackPop is injected by the library into the window or exported
import PaystackPop from "@paystack/inline-js";

interface PaystackOptions {
    onSuccess?: (transaction: any) => void;
    onCancel?: () => void;
}

export function usePaystack() {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    /**
     * Start a new transaction from the frontend
     */
    const startTransaction = useCallback((email: string, amount: number, options?: PaystackOptions) => {
        if (!publicKey) {
            console.error("Paystack public key is missing");
            return;
        }

        const paystack = new PaystackPop();
        paystack.newTransaction({
            key: publicKey,
            email,
            amount: amount * 100, // Paystack expects amount in Kobo/Pesewas
            onSuccess: (transaction: any) => {
                options?.onSuccess?.(transaction);
            },
            onCancel: () => {
                options?.onCancel?.();
            },
        });
    }, [publicKey]);

    /**
     * Resume a transaction using an access_code from the backend
     */
    const resumeTransaction = useCallback((accessCode: string, options?: PaystackOptions) => {
        const paystack = new PaystackPop();
        paystack.resumeTransaction(accessCode, {
            onSuccess: (transaction: any) => {
                options?.onSuccess?.(transaction);
            },
            onCancel: () => {
                options?.onCancel?.();
            },
        });
    }, []);

    return {
        startTransaction,
        resumeTransaction,
        isConfigured: !!publicKey,
    };
}
