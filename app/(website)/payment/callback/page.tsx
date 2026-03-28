"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Vote, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";

type CallbackState = "verifying" | "success" | "failed" | "unknown";

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [state, setState] = useState<CallbackState>("verifying");
    const [meta, setMeta] = useState<Record<string, any>>({});

    const paymentStatus = usePaymentStatus(paymentId);

    // Look up payment by reference
    useEffect(() => {
        if (!reference) {
            setState("unknown");
            return;
        }

        async function verifyPayment() {
            try {
                const { createClient } = await import("@/utils/supabase/client");
                const supabase = createClient();

                const { data, error } = await supabase
                    .from("payments")
                    .select("id, status, metadata, purpose, amount")
                    .eq("reference", reference)
                    .single();

                if (error || !data) {
                    setState("unknown");
                    return;
                }

                setPaymentId(data.id);
                setMeta({
                    ...data.metadata,
                    purpose: data.purpose,
                    amount: data.amount,
                });

                if (data.status === "completed") {
                    setState("success");
                } else if (data.status === "failed") {
                    setState("failed");
                }
                // Otherwise stay in "verifying" — the real-time hook will update
            } catch {
                setState("unknown");
            }
        }

        verifyPayment();
    }, [reference]);

    // Watch real-time status updates
    useEffect(() => {
        if (paymentStatus === "completed") setState("success");
        if (paymentStatus === "failed") setState("failed");
    }, [paymentStatus]);

    // Auto-timeout after 60s
    useEffect(() => {
        if (state !== "verifying") return;
        const timer = setTimeout(() => {
            setState("failed");
        }, 60000);
        return () => clearTimeout(timer);
    }, [state]);

    return (
        <main className="min-h-screen bg-[#F8F7F1] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
                    {/* Top gradient bar */}
                    <div className="h-1.5 bg-linear-to-r from-[#CE1126] via-[#FFCD00] to-[#009A44]" />

                    <div className="p-8 flex flex-col items-center text-center">
                        {/* ─── Verifying ─── */}
                        {state === "verifying" && (
                            <>
                                <div className="relative w-20 h-20 mb-6">
                                    <div className="absolute inset-0 rounded-full bg-[#009A44]/10 animate-ping" />
                                    <div className="relative w-20 h-20 rounded-full bg-[#009A44]/5 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-[#009A44] animate-spin" />
                                    </div>
                                </div>
                                <h1 className="text-xl font-black uppercase tracking-tight mb-2">
                                    Verifying Payment
                                </h1>
                                <p className="text-muted-foreground text-sm max-w-xs">
                                    Please wait while we confirm your payment. This
                                    usually takes a few seconds.
                                </p>
                                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#009A44] animate-pulse" />
                                    Listening for confirmation...
                                </div>
                            </>
                        )}

                        {/* ─── Success ─── */}
                        {state === "success" && (
                            <>
                                <div className="w-20 h-20 rounded-full bg-[#009A44]/10 flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-[#009A44]" />
                                </div>
                                <h1 className="text-xl font-black uppercase tracking-tight mb-2">
                                    Vote Confirmed! 🎉
                                </h1>
                                <p className="text-muted-foreground text-sm max-w-xs mb-6">
                                    {meta.vote_count
                                        ? `${meta.vote_count} vote${Number(meta.vote_count) > 1 ? "s" : ""} for ${meta.nominee_name || "your nominee"} recorded successfully.`
                                        : "Your payment has been confirmed and your vote has been recorded."}
                                </p>
                                {meta.amount && (
                                    <div className="w-full rounded-xl bg-[#009A44]/5 border border-[#009A44]/10 p-4 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Amount Paid</span>
                                            <span className="font-bold text-[#009A44]">
                                                GHS {Number(meta.amount).toFixed(2)}
                                            </span>
                                        </div>
                                        {reference && (
                                            <div className="flex justify-between text-xs mt-2">
                                                <span className="text-muted-foreground">Reference</span>
                                                <span className="font-mono text-muted-foreground">
                                                    {reference}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex gap-3 w-full">
                                    <Button asChild variant="outline" className="flex-1">
                                        <Link href="/">
                                            <Home className="w-4 h-4 mr-2" />
                                            Home
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="afro"
                                        className="flex-1"
                                    >
                                        <Link href="/events">
                                            <Vote className="w-4 h-4 mr-2" />
                                            Vote Again
                                        </Link>
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* ─── Failed ─── */}
                        {state === "failed" && (
                            <>
                                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                                    <XCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h1 className="text-xl font-black uppercase tracking-tight mb-2">
                                    Payment Failed
                                </h1>
                                <p className="text-muted-foreground text-sm max-w-xs mb-6">
                                    Your payment could not be verified. If money
                                    was deducted, it will be refunded automatically.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <Button asChild variant="outline" className="flex-1">
                                        <Link href="/">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Go Back
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="afro"
                                        className="flex-1"
                                    >
                                        <Link href="/events">
                                            Try Again
                                        </Link>
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* ─── Unknown ─── */}
                        {state === "unknown" && (
                            <>
                                <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mb-6">
                                    <XCircle className="w-10 h-10 text-yellow-500" />
                                </div>
                                <h1 className="text-xl font-black uppercase tracking-tight mb-2">
                                    Payment Not Found
                                </h1>
                                <p className="text-muted-foreground text-sm max-w-xs mb-6">
                                    We couldn't find a payment matching this
                                    reference. Please contact support if you
                                    believe this is an error.
                                </p>
                                <Button asChild variant="afro">
                                    <Link href="/">
                                        <Home className="w-4 h-4 mr-2" />
                                        Return Home
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer text */}
                <p className="text-center text-[10px] text-muted-foreground mt-4">
                    Payments secured by Paystack · Questions? Contact support
                </p>
            </div>
        </main>
    );
}
