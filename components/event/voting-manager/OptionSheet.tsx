"use client";

import { useEffect, useRef, useState, useTransition, useCallback, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
import { ConfirmDiscardDialog } from "@/components/common/ConfirmDiscardDialog";

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
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const imageDisplayUrl = previewUrl || getEventImageUrl(form.imageUrl);
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

    const isDirty = useMemo(() => {
        if (!editingOption) {
            return form.optionText !== "" || 
                   form.nomineeCode !== "" || 
                   form.email !== "" || 
                   form.description !== "" || 
                   form.imageUrl !== "" || 
                   form.fieldValues.some(f => f.value !== "") ||
                   pendingFile !== null;
        }
        
        const initialForm = {
            optionText: editingOption.optionText,
            nomineeCode: editingOption.nomineeCode ?? "",
            email: editingOption.email ?? "",
            description: editingOption.description ?? "",
            imageUrl: editingOption.imageUrl ?? "",
            fieldValues: category?.customFields?.map(field => ({
                fieldId: field.id,
                value: editingOption.fieldValues?.find(value => value.fieldId === field.id)?.value ?? "",
            })) ?? [],
        };

        return form.optionText !== initialForm.optionText ||
               form.nomineeCode !== initialForm.nomineeCode ||
               form.email !== initialForm.email ||
               form.description !== initialForm.description ||
               form.imageUrl !== initialForm.imageUrl ||
               JSON.stringify(form.fieldValues) !== JSON.stringify(initialForm.fieldValues) ||
               pendingFile !== null;
    }, [form, editingOption, category, pendingFile]);

    const handleCloseAttempt = (newOpen: boolean) => {
        if (!newOpen && isDirty) {
            setShowDiscardDialog(true);
        } else {
            onOpenChange(newOpen);
            if (!newOpen) {
                resetForm(category);
                setPendingFile(null);
                setPreviewUrl(null);
            }
        }
    };

    function updateFieldValue(fieldId: string, value: string) {
        setForm(prev => ({
            ...prev,
            fieldValues: prev.fieldValues.map(field =>
                field.fieldId === fieldId ? { ...field, value } : field
            ),
        }));
    }

    async function handleImageUpload(file: File) {
        setPendingFile(file);
        const url = URL.createObjectURL(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
        toast.success("Image ready");
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
            // Determine the final image URL:
            // 1. If we have a NEW file to upload, we'll set it after uploading.
            // 2. If no new file AND no existing image path, it means image was removed -> null.
            // 3. If no new file but we HAVE an existing image path, it stays as is.
            let finalImageUrl: string | null | undefined = form.imageUrl || (pendingFile ? undefined : null);

            if (pendingFile) {
                const uploadedPath = await uploadNominee(pendingFile, form.imageUrl);
                if (!uploadedPath) {
                    toast.error("Failed to upload image");
                    return;
                }
                finalImageUrl = uploadedPath;
            }

            const payload = {
                optionText: form.optionText,
                nomineeCode: form.nomineeCode || undefined,
                email: form.email || undefined,
                description: form.description || undefined,
                imageUrl: finalImageUrl,
                fieldValues: form.fieldValues.filter(field => field.value.trim()),
            };

            if (editingOption) {
                const result = await updateOption(editingOption.id, payload);

                if (result.success) {
                    onOptionUpdated({
                        ...editingOption,
                        optionText: form.optionText,
                        nomineeCode: result.data?.nomineeCode ?? editingOption.nomineeCode,
                        email: form.email || null,
                        description: form.description || null,
                        imageUrl: finalImageUrl || null,
                        fieldValues: form.fieldValues,
                    });
                    toast.success("Nominee updated");
                    onOpenChange(false);
                    resetForm(category);
                    setPendingFile(null);
                    setPreviewUrl(null);
                    return;
                }

                toast.error(result.error);
                return;
            }

            const result = await createOption(eventId, {
                categoryId: category.id,
                ...payload,
            });

            if (result.success) {
                onOptionCreated(category.id, {
                    id: result.data.id,
                    optionText: payload.optionText,
                    nomineeCode: result.data.nomineeCode ?? null,
                    email: payload.email || null,
                    description: payload.description || null,
                    imageUrl: finalImageUrl || null,
                    status: "approved" as VotingOptionStatus,
                    isPublicNomination: false,
                    nominatedByName: null,
                    votesCount: BigInt(0),
                    orderIdx: category.votingOptions.length,
                    deletionCode: null,
                    fieldValues: payload.fieldValues,
                });
                toast.success("Nominee added");
                onOpenChange(false);
                resetForm(category);
                setPendingFile(null);
                setPreviewUrl(null);
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <>
            <Sheet open={open} onOpenChange={handleCloseAttempt}>
                <SheetContent side="right" variant="afro" className="w-full sm:max-w-xl flex flex-col h-full">
                    <SheetHeader className="shrink-0">
                        <SheetTitle>
                            {editingOption ? "Edit Nominee" : "Add Nominee"}
                        </SheetTitle>
                        <SheetDescription>
                            {editingOption ? "Update nominee details" : "Add a new nominee to this category"}
                        </SheetDescription>
                    </SheetHeader>
                    <SheetBody className="space-y-4 flex-1 overflow-y-auto pr-2">
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label>Original Photo</Label>
                            <div className="flex items-start gap-4">
                                <div className="size-24 rounded-lg border bg-muted overflow-hidden relative shrink-0">
                                    {imageDisplayUrl ? (
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
                            <RichTextEditor
                                value={form.description}
                                onChange={(val) =>
                                    setForm(prev => ({ ...prev, description: val }))
                                }
                                placeholder="Brief description..."
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
                    <SheetFooter className="shrink-0 pt-2">
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

                    <ConfirmDiscardDialog
                        open={showDiscardDialog}
                        onOpenChange={setShowDiscardDialog}
                        onConfirm={() => {
                            setShowDiscardDialog(false);
                            onOpenChange(false);
                            resetForm(category);
                            setPendingFile(null);
                            setPreviewUrl(null);
                        }}
                    />
                </SheetContent>
            </Sheet>
        </>
    );
}
