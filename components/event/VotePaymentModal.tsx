"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getEventImageUrl } from "@/lib/image-url-utils";
import {
    Vote,
    Loader2,
    CheckCircle2,
    XCircle,
    Sparkles,
    Coins,
    Minus,
    Plus,
    Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VotingOption } from "@/lib/types/voting";
import { usePaystack } from "@/hooks/usePaystack";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VotePaymentModalProps {
    readonly nominee: VotingOption | null;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly votePrice: number;
    readonly eventId: string;
    readonly categoryId: string;
}

type ModalStep = "checkout" | "processing" | "success" | "error";

// ─── Component ────────────────────────────────────────────────────────────────

export function VotePaymentModal({
    nominee,
    open,
    onOpenChange,
    votePrice,
    eventId,
    categoryId,
}: VotePaymentModalProps) {
    const [step, setStep] = useState<ModalStep>("checkout");
    const [voteCount, setVoteCount] = useState(1);
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const { resumeTransaction } = usePaystack();

    const totalAmount = votePrice * voteCount;

    const resetModal = useCallback(() => {
        setStep("checkout");
        setVoteCount(1);
        setPhone("");
        setEmail("");
        setLoading(false);
        setErrorMsg("");
    }, []);

    const handleClose = useCallback(
        (newOpen: boolean) => {
            if (!newOpen) resetModal();
            onOpenChange(newOpen);
        },
        [onOpenChange, resetModal]
    );

    const increment = useCallback(() => {
        setVoteCount((prev) => prev + 1);
    }, []);

    const decrement = useCallback(() => {
        setVoteCount((prev) => Math.max(1, prev - 1));
    }, []);

    const handleSubmitPayment = useCallback(async () => {
        if (!nominee || !phone) return;

        setLoading(true);
        setErrorMsg("");

        try {
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();

            const callbackUrl = `${process.env.NEXT_PUBLIC_DOMAIN_URL || window.location.origin}/payment/callback`;

            // Normalise phone to E.164 for Paystack metadata
            const normalisedPhone = phone.startsWith("0")
                ? "233" + phone.slice(1)
                : phone.startsWith("+")
                    ? phone.slice(1)
                    : phone;

            // Use provided email or fallback to phone-derived (Paystack requires it)
            const finalEmail = email.includes("@")
                ? email
                : `${normalisedPhone}@voter.sankofa.app`;

            const { data: response, error } = await supabase.functions.invoke(
                "initiate-payment",
                {
                    body: {
                        amount: totalAmount,
                        email: finalEmail,
                        currency: "GHS",
                        purpose: `Vote for ${nominee.optionText}`,
                        relatedType: "vote",
                        relatedId: nominee.id,
                        metadata: {
                            event_id: eventId,
                            category_id: categoryId,
                            option_id: nominee.id,
                            vote_count: voteCount,
                            nominee_name: nominee.optionText,
                            phone: "+" + normalisedPhone,
                            callback_url: callbackUrl,
                        },
                    },
                }
            );

            if (error) throw new Error(error.message || "Payment initialization failed");

            // --- Use Paystack Inline ---
            // The edge function returns: { success: true, accessCode: "...", ... }
            if (response?.accessCode) {
                resumeTransaction(response.accessCode, {
                    onSuccess: (transaction: any) => {
                        console.log("Paystack Success:", transaction);
                        setStep("success");
                    },
                    onCancel: () => {
                        console.log("Paystack Cancelled");
                        setLoading(false);
                    }
                });
            } else {
                throw new Error(response?.error || response?.detail || "Failed to get access code from Paystack");
            }
        } catch (err: any) {
            console.error("Payment Error:", err);
            setErrorMsg(err.message || "Something went wrong during payment setup.");
            setStep("error");
        } finally {
            setLoading(false);
        }
    }, [nominee, phone, email, totalAmount, eventId, categoryId, voteCount, resumeTransaction]);

    if (!nominee) return null;

    const displayImageUrl = getEventImageUrl(nominee.imageUrl);

    return (
        <Dialog open={open} onOpenChange={handleClose} modal={false}>
            <DialogContent
                className="sm:max-w-md p-0 overflow-hidden gap-0 border-0 rounded-2xl bg-white"
                onOpenAutoFocus={(e) => {
                    if (loading) e.preventDefault();
                }}
                onFocusOutside={(e) => {
                    if (loading) e.preventDefault();
                }}
                onInteractOutside={(e) => {
                    // Prevent the Radix modal from closing when interacting with Paystack's overlay
                    if (loading) e.preventDefault();
                }}
            >
                {/* Hero Header */}
                <div className="relative h-36 w-full bg-linear-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#FFCD00]/20 blur-2xl" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#009A44]/20 blur-2xl" />
                    <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#CE1126]/15 blur-lg" />

                    <div className="relative z-10 flex items-end h-full p-5">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl shrink-0 bg-white/10">
                            {displayImageUrl ? (
                                <Image
                                    src={displayImageUrl}
                                    alt={nominee.optionText}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Vote className="w-6 h-6 text-white/40" />
                                </div>
                            )}
                        </div>
                        <div className="ml-4 min-w-0">
                            <p className="text-[#FFCD00] text-[11px] font-bold uppercase tracking-[0.15em] mb-0.5">
                                Voting for
                            </p>
                            <h3 className="text-white font-black text-lg truncate leading-tight">
                                {nominee.optionText}
                            </h3>
                            {nominee.nomineeCode && (
                                <p className="text-white/50 text-xs font-mono mt-0.5">
                                    {nominee.nomineeCode}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogHeader className="sr-only">
                    <DialogTitle>Vote for {nominee.optionText}</DialogTitle>
                </DialogHeader>

                {/* ─── Checkout ──────────────────────────────────── */}
                {step === "checkout" && (
                    <div className="p-5 space-y-5">
                        {/* Vote Counter */}
                        <div>
                            <p className="text-sm font-semibold text-foreground mb-3">
                                Number of votes
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    type="button"
                                    onClick={decrement}
                                    disabled={voteCount <= 1}
                                    className={cn(
                                        "w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200",
                                        voteCount <= 1
                                            ? "border-muted text-muted-foreground/40 cursor-not-allowed"
                                            : "border-muted-foreground/20 text-foreground hover:border-[#CE1126] hover:text-[#CE1126] hover:bg-[#CE1126]/5 active:scale-95"
                                    )}
                                >
                                    <Minus className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col items-center min-w-[80px]">
                                    <span className="text-4xl font-black tabular-nums text-foreground leading-none">
                                        {voteCount}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground mt-1">
                                        vote{voteCount !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={increment}
                                    className="w-12 h-12 rounded-xl border-2 border-muted-foreground/20 flex items-center justify-center text-foreground hover:border-[#009A44] hover:text-[#009A44] hover:bg-[#009A44]/5 active:scale-95 transition-all duration-200"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-[#009A44]/5 to-[#FFCD00]/5 border border-[#009A44]/10">
                            <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-[#009A44]" />
                                <span className="text-sm font-medium">
                                    Total
                                </span>
                            </div>
                            <span className="text-xl font-black text-[#009A44]">
                                GHS {(totalAmount).toFixed(2)}
                            </span>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="voter-phone" className="text-sm font-semibold">
                                    Phone Number
                                </Label>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center h-11 px-3 rounded-lg border bg-muted/50 text-sm font-medium text-muted-foreground border-muted-foreground/20 shrink-0">
                                        +233
                                    </span>
                                    <Input
                                        id="voter-phone"
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="244 123 456"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                                        className="h-11 rounded-lg"
                                        maxLength={10}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="voter-email" className="text-sm font-semibold flex items-center gap-1.5">
                                    Email Address <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <Input
                                        id="voter-email"
                                        type="email"
                                        placeholder="voter@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11 pl-10 rounded-lg"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground pl-1">
                                    Receive a receipt from Paystack
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="afro"
                            size="lg"
                            className="w-full h-12 text-sm font-bold shadow-lg shadow-[#009A44]/20"
                            onClick={handleSubmitPayment}
                            disabled={!phone || phone.length < 9 || loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Initialising...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Proceed to Payment
                                </>
                            )}
                        </Button>

                        <p className="text-[10px] text-center text-muted-foreground leading-relaxed mt-2">
                            Payments secured by Paystack · Supported: MoMo & Cards
                        </p>
                    </div>
                )}

                {/* ─── Processing ──────────────────────────────────── */}
                {step === "processing" && (
                    <div className="p-8 flex flex-col items-center text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-[#009A44] animate-spin" />
                        <div>
                            <p className="font-bold text-lg">
                                Opening checkout...
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Please complete the payment in the secure popup.
                            </p>
                        </div>
                    </div>
                )}

                {/* ─── Error ───────────────────────────────────── */}
                {step === "error" && (
                    <div className="p-8 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Payment Error</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {errorMsg || "Something went wrong. Please try again."}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setStep("checkout")}
                            className="mt-2"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* ─── Success ─────────────────────────────────── */}
                {step === "success" && (
                    <div className="p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-[#009A44]/10 animate-ping" />
                            <div className="relative w-24 h-24 rounded-full bg-[#009A44]/10 flex items-center justify-center">
                                <CheckCircle2 className="w-12 h-12 text-[#009A44]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                                Vote Confirmed! 🎉
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-[280px]">
                                Your <strong>{voteCount} vote{voteCount > 1 ? "s" : ""}</strong> for{" "}
                                <span className="text-[#009A44] font-bold">{nominee.optionText}</span> have been recorded successfully.
                            </p>
                        </div>
                        <Button
                            variant="afro"
                            size="lg"
                            className="w-full h-12"
                            onClick={() => handleClose(false)}
                        >
                            Back to Event
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
