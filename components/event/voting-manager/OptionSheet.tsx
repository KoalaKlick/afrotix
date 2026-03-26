"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetBody,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
    Loader2,
    Upload,
    ImageIcon,
    Mail,
    Hash,
    FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { VotingCategory, VotingOption, VotingOptionStatus } from "@/lib/types/voting";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import {
    createOption,
    updateOption,
} from "@/lib/actions/voting";
import { OptionCustomFieldInput } from "./OptionCustomFieldInput";

export interface OptionFormData {
    optionText: string;
    nomineeCode: string;
    email: string;
    description: string;
    imageUrl: string;
    fieldValues: { fieldId: string; value: string }[];
}

interface OptionSheetProps {
    readonly eventId: string;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly category: VotingCategory | null;
    readonly editingOption: VotingOption | null;
    readonly onOptionCreated: (categoryId: string, option: VotingOption) => void;
    readonly onOptionUpdated: (option: VotingOption) => void;
}

export function OptionSheet({
    eventId,
    open,
    onOpenChange,
    category,
    editingOption,
    onOptionCreated,
    onOptionUpdated,
}: OptionSheetProps) {
    const [form, setForm] = useState<OptionFormData>({
        optionText: "",
        nomineeCode: "",
        email: "",
        description: "",
        imageUrl: "",
        fieldValues: [],
    });
    const imageDisplayUrl = getEventImageUrl(form.imageUrl);
    const [isPending, startTransition] = useTransition();
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { isUploading: isUploadingImage, upload: uploadNominee } = useImageUpload({
        bucket: "events",
        folder: "nominees",
        convertOptions: { quality: 0.85, maxWidth: 400, maxHeight: 400, maxSizeMB: 1 },
    });

    const resetForm = useCallback((nextCategory?: VotingCategory | null) => {
        setForm({
            optionText: "",
            nomineeCode: "",
            email: "",
            description: "",
            imageUrl: "",
            fieldValues: (nextCategory?.customFields ?? []).map(field => ({
                fieldId: field.id,
                value: "",
            })),
        });
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (editingOption) {
            setForm({
                optionText: editingOption.optionText,
                nomineeCode: editingOption.nomineeCode ?? "",
                email: editingOption.email ?? "",
                description: editingOption.description ?? "",
                imageUrl: editingOption.imageUrl ?? "",
                fieldValues: category?.customFields?.map(field => ({
                    fieldId: field.id,
                    value: editingOption.fieldValues?.find(value => value.fieldId === field.id)?.value ?? "",
                })) ?? [],
            });
            return;
        }

        resetForm(category);
    }, [category, editingOption, open, resetForm]);

    function updateFieldValue(fieldId: string, value: string) {
        setForm(prev => ({
            ...prev,
            fieldValues: prev.fieldValues.map(field =>
                field.fieldId === fieldId ? { ...field, value } : field
            ),
        }));
    }

    async function handleImageUpload(file: File) {
        const path = await uploadNominee(file, form.imageUrl || null);
        if (path) {
            setForm(prev => ({ ...prev, imageUrl: path }));
            toast.success("Image uploaded");
        }
    }

    function handleSave() {
        if (!form.optionText.trim()) {
            toast.error("Nominee name is required");
            return;
        }

        if (!category) {
            return;
        }

        startTransition(async () => {
            if (editingOption) {
                const result = await updateOption(editingOption.id, {
                    optionText: form.optionText,
                    nomineeCode: form.nomineeCode || undefined,
                    email: form.email || undefined,
                    description: form.description || undefined,
                    imageUrl: form.imageUrl || undefined,
                    fieldValues: form.fieldValues.filter(field => field.value.trim()),
                });

                if (result.success) {
                    onOptionUpdated({
                        ...editingOption,
                        optionText: form.optionText,
                        nomineeCode: result.data?.nomineeCode ?? editingOption.nomineeCode,
                        email: form.email || null,
                        description: form.description || null,
                        imageUrl: form.imageUrl || null,
                        fieldValues: form.fieldValues,
                    });
                    toast.success("Nominee updated");
                    onOpenChange(false);
                    resetForm(category);
                    return;
                }

                toast.error(result.error);
                return;
            }

            const result = await createOption(eventId, {
                categoryId: category.id,
                optionText: form.optionText,
                nomineeCode: form.nomineeCode || undefined,
                email: form.email || undefined,
                description: form.description || undefined,
                imageUrl: form.imageUrl || undefined,
                fieldValues: form.fieldValues.filter(field => field.value.trim()),
            });

            if (result.success) {
                onOptionCreated(category.id, {
                    id: result.data.id,
                    optionText: form.optionText,
                    nomineeCode: result.data.nomineeCode ?? null,
                    email: form.email || null,
                    description: form.description || null,
                    imageUrl: form.imageUrl || null,
                    status: "approved" as VotingOptionStatus,
                    isPublicNomination: false,
                    nominatedByName: null,
                    votesCount: BigInt(0),
                    orderIdx: category.votingOptions.length,
                    fieldValues: form.fieldValues,
                });
                toast.success("Nominee added");
                onOpenChange(false);
                resetForm(category);
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <>
            <Sheet open={open} onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) {
                    resetForm(category);
                }
            }}>
                <SheetContent side="right" variant="afro" className="w-full sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {editingOption ? "Edit Nominee" : "Add Nominee"}
                        </SheetTitle>
                        <SheetDescription>
                            {editingOption ? "Update nominee details" : "Add a new nominee to this category"}
                        </SheetDescription>
                    </SheetHeader>
                    <SheetBody className="space-y-4">
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label>Original Photo</Label>
                            <div className="flex items-start gap-4">
                                <div className="size-24 rounded-lg border bg-muted overflow-hidden relative shrink-0">
                                    {form.imageUrl && imageDisplayUrl ? (
                                        <Image
                                            src={imageDisplayUrl}
                                            alt="Nominee"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="size-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
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
                                        disabled={isUploadingImage}
                                    >
                                        {isUploadingImage ? (
                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                        ) : (
                                            <Upload className="size-4 mr-2" />
                                        )}
                                        Upload Photo
                                    </Button>
                                    {form.imageUrl && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setForm(prev => ({ ...prev, imageUrl: "" }))}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="option-name">Name *</Label>
                            <Input
                                id="option-name"
                                value={form.optionText}
                                onChange={(e) =>
                                    setForm(prev => ({ ...prev, optionText: e.target.value }))
                                }
                                placeholder="e.g., John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="option-code" className="flex items-center gap-2">
                                <Hash className="size-4" />
                                Nominee Code
                            </Label>
                            <Input
                                id="option-code"
                                value={form.nomineeCode}
                                onChange={(e) =>
                                    setForm(prev => ({ ...prev, nomineeCode: e.target.value }))
                                }
                                placeholder="e.g., NOM001 (auto-generated if empty)"
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique code for voting. Leave empty to auto-generate.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="option-email" className="flex items-center gap-2">
                                <Mail className="size-4" />
                                Email
                            </Label>
                            <Input
                                id="option-email"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm(prev => ({ ...prev, email: e.target.value }))
                                }
                                placeholder="nominee@email.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="option-description">Description</Label>
                            <Textarea
                                id="option-description"
                                value={form.description}
                                onChange={(e) =>
                                    setForm(prev => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Brief description..."
                                rows={3}
                            />
                        </div>

                        {/* Custom Fields */}
                        {category?.customFields && category.customFields.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <Label className="flex items-center gap-2">
                                        <FileText className="size-4" />
                                        Additional Information
                                    </Label>
                                    {category.customFields.map((field) => {
                                        const fieldValue = form.fieldValues.find(currentField => currentField.fieldId === field.id);
                                        return (
                                            <OptionCustomFieldInput
                                                key={field.id}
                                                field={field}
                                                value={fieldValue?.value ?? ""}
                                                onChange={(value) => updateFieldValue(field.id, value)}
                                            />
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </SheetBody>
                    <SheetFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                resetForm(category);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isPending || isUploadingImage}>
                            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                            {editingOption ? "Save Changes" : "Add Nominee"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
