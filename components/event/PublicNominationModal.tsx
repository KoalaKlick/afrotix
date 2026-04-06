"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Loader2, Upload, ImageIcon, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { submitPublicNominationAction } from "@/lib/actions/voting";
import { createClient } from "@/utils/supabase/client";
import type { VotingCategoryWithOptions } from "@/lib/dal/voting";
import { OptionCustomFieldInput } from "@/components/event/voting-manager/OptionCustomFieldInput";

interface PublicNominationModalProps {
    readonly eventId: string;
    readonly category: VotingCategoryWithOptions;
}

export function PublicNominationModal({ eventId, category }: PublicNominationModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

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

    async function handleImageUpload(file: File) {
        setPendingFile(file);
        const url = URL.createObjectURL(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
    }

    function handleOpenChange(newOpen: boolean) {
        if (!newOpen) resetForm();
        setOpen(newOpen);
    }

    function updateFieldValue(fieldId: string, value: string) {
        setForm(prev => ({
            ...prev,
            fieldValues: prev.fieldValues.map(f => f.fieldId === fieldId ? { ...f, value } : f)
        }));
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.optionText.trim()) {
            toast.error("Nominee name is required.");
            return;
        }

        startTransition(async () => {
            let finalImageUrl = undefined;
            if (pendingFile) {
                // Secure Approach: Ensure anonymous sign-in before upload
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

            const res = await submitPublicNominationAction({
                eventId,
                categoryId: category.id,
                optionText: form.optionText,
                email: form.email || undefined,
                description: form.description || undefined,
                imageUrl: finalImageUrl,
                nominatorName: form.nominatorName || undefined,
                nominatorEmail: form.nominatorEmail || undefined,
                fieldValues: form.fieldValues.filter(f => f.value.trim()),
            });

            if (res.success) {
                toast.success("Nomination submitted for review. Thank you!");
                setOpen(false);
                resetForm();
            } else {
                toast.error(res.error || "Failed to submit nomination.");
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button variant="primary" size="sm" className="w-full sm:w-auto gap-2">
                    <PlusCircle className="size-4" />
                    Nominate for this Category
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-xl w-full flex flex-col h-full p-0 sm:p-6" variant="afro">
                <SheetHeader className="shrink-0 pt-6 px-6 sm:p-0">
                    <SheetTitle>Nominate Someone</SheetTitle>
                    <SheetDescription>
                        Submit a nomination for {category.name}. It will be reviewed by the organizers before appearing publicly.
                        {Number(category.nominationPrice) > 0 && (
                            <span className="block mt-2 font-bold text-brand-primary">
                                Nomination Fee: GHS {Number(category.nominationPrice).toFixed(2)}
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
                                            field={field as any}
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

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || isUploading}>
                            {(isPending || isUploading) && <Loader2 className="size-4 mr-2 animate-spin" />}
                            Submit Nomination
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
