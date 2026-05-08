"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Loader2, Upload, ImageIcon, PlusCircle, CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { submitPublicNominationAction } from "@/lib/actions/voting";
import { createClient } from "@/utils/supabase/client";
import type { VotingCategoryWithOptions } from "@/lib/dal/voting";
import type { CustomField } from "@/lib/types/voting";
import { OptionCustomFieldInput } from "@/components/event/voting-manager/OptionCustomFieldInput";
import { usePaystack } from "@/hooks/usePaystack";


// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicNominationModalProps {
    readonly eventId: string;
    readonly category: VotingCategoryWithOptions;
    readonly orgSlug?: string;
    readonly eventSlug?: string;
}

interface NomData {
    optionText: string;
    email?: string;
    description?: string;
    imageUrl?: string;
    nominatorName?: string;
    nominatorEmail?: string;
    fieldValues: { fieldId: string; value: string }[];
}

type PayStep = "checkout" | "processing" | "success" | "error";

// ─── Component ────────────────────────────────────────────────────────────────

export function PublicNominationModal({ eventId, category, orgSlug, eventSlug }: PublicNominationModalProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const nominationPrice = Number(category.nominationPrice) || 0;
    const isPaid = nominationPrice > 0;

    // ── Confirmation dialog state ─────────────────────────────────────────────
    const [showPayDialog, setShowPayDialog] = useState(false);
    const [payStep, setPayStep] = useState<PayStep>("checkout");
    const [payLoading, setPayLoading] = useState(false);
    const [payError, setPayError] = useState("");
    const [nomData, setNomData] = useState<NomData | null>(null);


    const { resumeTransaction } = usePaystack();

    // ── Form state ───────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        optionText: "",
        email: "",
        description: "",
        nominatorName: "",
        nominatorEmail: "",
        fieldValues: (category.customFields ?? []).map(f => ({ fieldId: f.id, value: "" }))
    });

    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const { isUploading, upload } = useImageUpload({
        bucket: "events",
        folder: "nominations",
        convertOptions: { quality: 0.85, maxWidth: 400, maxHeight: 400, maxSizeMB: 1 },
    });

    // ── Helpers ──────────────────────────────────────────────────────────────
    function resetForm() {
        setForm({
            optionText: "",
            email: "",
            description: "",
            nominatorName: "",
            nominatorEmail: "",
            fieldValues: (category.customFields ?? []).map(f => ({ fieldId: f.id, value: "" }))
        });
        setPendingFile(null);
        setPreviewUrl(null);
    }

    function resetPayDialog() {
        setPayStep("checkout");
        setPayLoading(false);
        setPayError("");
        setNomData(null);
    }

    function handleSheetOpenChange(open: boolean) {
        if (!open) resetForm();
        setSheetOpen(open);
    }

    function handlePayDialogOpenChange(open: boolean) {
        if (!open) resetPayDialog();
        setShowPayDialog(open);
    }

    function updateFieldValue(fieldId: string, value: string) {
        setForm(prev => ({
            ...prev,
            fieldValues: prev.fieldValues.map(f => f.fieldId === fieldId ? { ...f, value } : f)
        }));
    }

    async function handleImageUpload(file: File) {
        setPendingFile(file);
        const url = URL.createObjectURL(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
    }

    // ── Form submit ──────────────────────────────────────────────────────────
    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.optionText.trim()) {
            toast.error("Nominee name is required.");
            return;
        }

        startTransition(async () => {
            let finalImageUrl: string | undefined;
            if (pendingFile) {
                // Ensure anonymous sign-in before upload
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    const { error: authError } = await supabase.auth.signInAnonymously();
                    if (authError) {
                        toast.error("Unable to establish a secure session for upload. Please try again.");
                        return;
                    }
                }
                const uploadedPath = await upload(pendingFile);
                if (!uploadedPath) {
                    toast.error("Image upload failed");
                    return;
                }
                finalImageUrl = uploadedPath;
            }

            // Buffer nomination data and show confirmation dialog for both free and paid
            setNomData({
                optionText: form.optionText,
                email: form.email || undefined,
                description: form.description || undefined,
                imageUrl: finalImageUrl,
                nominatorName: form.nominatorName || undefined,
                nominatorEmail: form.nominatorEmail || undefined,
                fieldValues: form.fieldValues.filter(f => f.value.trim()),
            });
            setShowPayDialog(true);
        });
    }

    // ── Confirmation / payment handler ───────────────────────────────────────
    const handleConfirm = useCallback(async () => {
        if (!nomData) return;

        setPayLoading(true);
        setPayError("");

        try {
            if (!isPaid) {
                // ── Free nomination: submit directly from the confirmation dialog ──
                const res = await submitPublicNominationAction({
                    eventId,
                    categoryId: category.id,
                    optionText: nomData.optionText,
                    email: nomData.email,
                    description: nomData.description,
                    imageUrl: nomData.imageUrl,
                    nominatorName: nomData.nominatorName,
                    nominatorEmail: nomData.nominatorEmail,
                    fieldValues: nomData.fieldValues,
                });
                if (res.success) {
                    setPayStep("success");
                } else {
                    setPayError(res.error || "Failed to submit nomination.");
                    setPayStep("error");
                }
                return;
            }

            // ── Paid nomination: open Paystack (it handles phone/card entry) ──
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) await supabase.auth.signInAnonymously();

            const origin = process.env.NEXT_PUBLIC_DOMAIN_URL || globalThis.location?.origin || "";
            const callbackUrl = `${origin}/payment/callback`;

            // Derive a valid email for Paystack — use nominator/nominee email or a placeholder
            const derivedEmail =
                nomData.nominatorEmail ||
                nomData.email ||
                `nom-${crypto.randomUUID().slice(0, 8)}@pay.afrotix.app`;

            const { data: response, error } = await supabase.functions.invoke(
                "initiate-payment",
                {
                    body: {
                        amount: nominationPrice,
                        email: derivedEmail,
                        currency: "GHS",
                        purpose: "nomination",
                        relatedType: "nomination",
                        // No relatedId — webhook creates the nomination record after payment
                        metadata: {
                            event_id: eventId,
                            category_id: category.id,
                            nominee_name: nomData.optionText,
                            nominee_email: nomData.email ?? null,
                            nominee_description: nomData.description ?? null,
                            nominee_image_url: nomData.imageUrl ?? null,
                            nominator_name: nomData.nominatorName ?? null,
                            nominator_email: nomData.nominatorEmail ?? null,
                            field_values: nomData.fieldValues,
                            org_slug: orgSlug ?? null,
                            event_slug: eventSlug ?? null,
                            callback_url: callbackUrl,
                        },
                    },
                }
            );

            if (error) {
                let message = "Payment initialization failed. Please try again.";
                try {
                    const body = await (error as any).context?.json?.();
                    if (body?.error) message = body.error;
                } catch { /* ignore parse errors */ }
                throw new Error(message);
            }

            if (!response?.accessCode) {
                throw new Error(response?.error ?? response?.detail ?? "Failed to get access code");
            }

            resumeTransaction(response.accessCode, {
                onSuccess: () => setPayStep("success"),
                onCancel: () => setPayLoading(false),
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong.";
            console.error("Nomination confirm error:", err);
            setPayError(message);
            setPayStep("error");
        } finally {
            setPayLoading(false);
        }
    }, [nomData, isPaid, nominationPrice, eventId, category.id, orgSlug, eventSlug, resumeTransaction]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Nomination form Sheet ──────────────────────────────────── */}
            <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto gap-2">
                        <PlusCircle className="size-4" />
                        Nominate for this Category
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="sm:max-w-xl w-full flex flex-col h-full p-0 sm:p-6" variant="afro">
                    <SheetHeader className="shrink-0 pt-6 px-6 sm:p-0">
                        <SheetTitle>Nominate Someone</SheetTitle>
                        <SheetDescription>
                            Submit a nomination for {category.name}. It will be reviewed by the organizers before appearing publicly.
                            {isPaid && (
                                <span className="block mt-2 font-bold text-brand-primary">
                                    Nomination Fee: GHS {nominationPrice.toFixed(2)}
                                </span>
                            )}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={onSubmit} className="flex-1 overflow-y-auto space-y-6 pt-4 px-6 sm:px-1 min-h-0">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nominee Photo (Optional)</Label>
                                <div className="flex items-start gap-4">
                                    <div className="size-20 rounded-lg border bg-muted overflow-hidden relative shrink-0">
                                        {previewUrl ? (
                                            <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="size-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(file);
                                                e.target.value = "";
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => imageInputRef.current?.click()}
                                            disabled={isUploading}
                                        >
                                            <Upload className="size-4 mr-2" /> Upload
                                        </Button>
                                        {previewUrl && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setPendingFile(null); setPreviewUrl(null); }}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nomineeName">Nominee Name *</Label>
                                <Input
                                    id="nomineeName"
                                    placeholder="Who are you nominating?"
                                    value={form.optionText}
                                    onChange={(e) => setForm(f => ({ ...f, optionText: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nomineeEmail">Nominee Email (Optional)</Label>
                                <Input
                                    id="nomineeEmail"
                                    type="email"
                                    placeholder="so we can notify them"
                                    value={form.email}
                                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Why should they win? (Optional)</Label>
                                <RichTextEditor
                                    value={form.description}
                                    onChange={(val) => setForm(f => ({ ...f, description: val }))}
                                    placeholder="Tell us why..."
                                    minimal
                                />
                            </div>

                            {category.customFields && category.customFields.length > 0 && (
                                <div className="space-y-4 pt-2 border-t">
                                    <Label className="block text-md font-semibold">Additional Info</Label>
                                    {category.customFields.map((field) => {
                                        const fieldValue = form.fieldValues.find(f => f.fieldId === field.id);
                                        return (
                                            <OptionCustomFieldInput
                                                key={field.id}
                                                field={field as CustomField}
                                                value={fieldValue?.value ?? ""}
                                                onChange={(val) => updateFieldValue(field.id, val)}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t">
                                <Label className="block text-md font-semibold">Your Details (Optional)</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nominatorName">Your Name</Label>
                                        <Input
                                            id="nominatorName"
                                            placeholder="Jane Doe"
                                            value={form.nominatorName}
                                            onChange={(e) => setForm(f => ({ ...f, nominatorName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nominatorEmail">Your Email</Label>
                                        <Input
                                            id="nominatorEmail"
                                            type="email"
                                            placeholder="jane@example.com"
                                            value={form.nominatorEmail}
                                            onChange={(e) => setForm(f => ({ ...f, nominatorEmail: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 pb-6">
                            <Button type="button" variant="outline" onClick={() => handleSheetOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={isPending || isUploading}>
                                {(isPending || isUploading) && <Loader2 className="size-4 mr-2 animate-spin" />}
                                {isPaid
                                    ? `Nominate · Pay GHS ${nominationPrice.toFixed(2)}`
                                    : "Submit Nomination"
                                }
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* ── Confirmation Dialog (free + paid) ───────────────────────── */}
            {showPayDialog && (
                <div 
                    className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0" 
                    aria-hidden="true" 
                    onClick={() => handlePayDialogOpenChange(false)} 
                />
            )}
            <Dialog open={showPayDialog} onOpenChange={handlePayDialogOpenChange} modal={false}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{isPaid ? "Confirm & Pay" : "Confirm Nomination"}</DialogTitle>
                    </DialogHeader>

                    <DialogBody>

                    {/* Checkout / Confirm */}
                    {payStep === "checkout" && (
                        <div className="space-y-5">
                            <div className="rounded-xl border bg-muted/30 p-4 space-y-1">
                                <p className="text-sm text-muted-foreground">Nominating</p>
                                <p className="font-semibold">{nomData?.optionText}</p>
                                <p className="text-xs text-muted-foreground">{category.name}</p>
                                {isPaid && (
                                    <p className="mt-1 text-lg font-black text-[#009A44]">
                                        GHS {nominationPrice.toFixed(2)}
                                    </p>
                                )}
                            </div>

                            {isPaid ? (
                                <Button
                                    variant="afro-cta"
                                    size="lg"
                                    className="w-full h-12 font-bold"
                                    onClick={handleConfirm}
                                    disabled={payLoading}
                                >
                                    {payLoading
                                        ? <><Loader2 className="size-4 mr-2 animate-spin" /> Opening checkout...</>
                                        : <><CreditCard className="size-4 mr-2" /> Confirm &amp; Pay GHS {nominationPrice.toFixed(2)}</>
                                    }
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full h-12 font-bold"
                                    onClick={handleConfirm}
                                    disabled={payLoading}
                                >
                                    {payLoading
                                        ? <><Loader2 className="size-4 mr-2 animate-spin" /> Submitting...</>
                                        : "Confirm Nomination"
                                    }
                                </Button>
                            )}

                            {isPaid && (
                                <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                                    Payments secured by Paystack · MoMo &amp; Cards accepted
                                </p>
                            )}
                        </div>
                    )}

                    {/* Success */}
                    {payStep === "success" && (
                        <div className="flex flex-col items-center py-10 space-y-4 text-center animate-in fade-in zoom-in duration-300">
                            <div className="size-16 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircle2 className="size-9 text-green-500" />
                            </div>
                            <div>
                                <p className="font-black text-xl">Nomination submitted!</p>
                                {isPaid
                                    ? (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {nomData?.nominatorEmail || nomData?.email
                                                ? "Payment confirmed. We've sent your exit key by email."
                                                : "Payment confirmed. The organizers will review it shortly."
                                            }
                                        </p>
                                    )
                                    : (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Your nomination has been submitted for review. Thank you!
                                        </p>
                                    )
                                }
                            </div>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowPayDialog(false);
                                    setSheetOpen(false);
                                    resetForm();
                                    resetPayDialog();
                                }}
                            >
                                Done
                            </Button>
                        </div>
                    )}

                    {/* Error */}
                    {payStep === "error" && (
                        <div className="flex flex-col items-center py-10 space-y-4 text-center">
                            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center">
                                <XCircle className="size-9 text-red-500" />
                            </div>
                            <div>
                                <p className="font-black text-xl">{isPaid ? "Payment failed" : "Submission failed"}</p>
                                <p className="text-sm text-muted-foreground mt-1 px-4">
                                    {payError || "Something went wrong. Please try again."}
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => setPayStep("checkout")}>
                                Try Again
                            </Button>
                        </div>
                    )}
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </>
    );
}

