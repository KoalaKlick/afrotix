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
    Layers,
    Mail,
    Hash,
    FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { VotingCategory, VotingOption, VotingOptionStatus } from "@/lib/types/voting";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { convertToWebP } from "@/lib/image-utils";
import { TemplateEditor, type TemplateConfig } from "@/components/shared/template-editor";
import {
    createOption,
    updateOption,
    uploadNomineeImage,
} from "@/lib/actions/voting";
import { OptionCustomFieldInput } from "./OptionCustomFieldInput";

export interface OptionFormData {
    optionText: string;
    nomineeCode: string;
    email: string;
    description: string;
    imageUrl: string;
    finalImage: string;
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
        finalImage: "",
        fieldValues: [],
    });
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingTemplatePhoto, setIsUploadingTemplatePhoto] = useState(false);
    const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
    const [uploadedPhotoForTemplate, setUploadedPhotoForTemplate] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const imageInputRef = useRef<HTMLInputElement>(null);
    const templatePhotoInputRef = useRef<HTMLInputElement>(null);

    const imageDisplayUrl = getEventImageUrl(form.imageUrl);
    const finalImageDisplayUrl = getEventImageUrl(form.finalImage);

    const resetForm = useCallback((nextCategory?: VotingCategory | null) => {
        setForm({
            optionText: "",
            nomineeCode: "",
            email: "",
            description: "",
            imageUrl: "",
            finalImage: "",
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
                finalImage: editingOption.finalImage ?? "",
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
        setIsUploadingImage(true);
        try {
            const optimizedFile = await convertToWebP(file, {
                quality: 0.85,
                maxWidth: 400,
                maxHeight: 400,
                maxSizeMB: 1,
            });

            const formData = new FormData();
            formData.set("file", optimizedFile);
            if (form.imageUrl) {
                formData.set("oldImagePath", form.imageUrl);
            }

            const result = await uploadNomineeImage(formData);
            if (result.success) {
                setForm(prev => ({ ...prev, imageUrl: result.data.path }));
                toast.success("Image uploaded");
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to upload image");
        } finally {
            setIsUploadingImage(false);
        }
    }

    async function handleTemplateEditorSave(finalImageDataUrl: string, _config: TemplateConfig) {
        setIsUploadingImage(true);
        try {
            const response = await fetch(finalImageDataUrl);
            const blob = await response.blob();
            const file = new File([blob], "template-image.webp", { type: "image/webp" });

            const formData = new FormData();
            formData.set("file", file);
            if (form.finalImage) {
                formData.set("oldImagePath", form.finalImage);
            }

            const result = await uploadNomineeImage(formData);
            if (result.success) {
                setForm(prev => ({ ...prev, finalImage: result.data.path }));
                toast.success("Template applied successfully");
                setTemplateEditorOpen(false);
                if (uploadedPhotoForTemplate?.startsWith("blob:")) {
                    URL.revokeObjectURL(uploadedPhotoForTemplate);
                }
                setUploadedPhotoForTemplate(null);
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to save templated image");
        } finally {
            setIsUploadingImage(false);
        }
    }

    function handleApplyTemplateWithMainPhoto() {
        if (!form.imageUrl || !imageDisplayUrl) {
            toast.error("No nominee photo available. Upload a photo or use 'Upload for Template'.");
            return;
        }

        setUploadedPhotoForTemplate(imageDisplayUrl);
        setTemplateEditorOpen(true);
    }

    async function handleTemplatePhotoUpload(file: File) {
        setIsUploadingTemplatePhoto(true);
        try {
            const optimizedFile = await convertToWebP(file, {
                quality: 0.85,
                maxWidth: 1200,
                maxHeight: 1200,
                maxSizeMB: 2,
            });

            const tempUrl = URL.createObjectURL(optimizedFile);
            setUploadedPhotoForTemplate(tempUrl);
            setTemplateEditorOpen(true);
        } catch {
            toast.error("Failed to process image");
        } finally {
            setIsUploadingTemplatePhoto(false);
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
                    finalImage: form.finalImage || undefined,
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
                        finalImage: form.finalImage || null,
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
                finalImage: form.finalImage || undefined,
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
                    finalImage: form.finalImage || null,
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
                <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
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

                    {/* Template Image Section */}
                    {category?.templateImage && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Layers className="size-4" />
                                Template Image
                            </Label>
                            <div className="flex items-start gap-4">
                                <div className="size-24 rounded-lg border bg-muted overflow-hidden relative shrink-0">
                                    {form.finalImage && finalImageDisplayUrl ? (
                                        <Image
                                            src={finalImageDisplayUrl}
                                            alt="Template preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Layers className="size-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {form.imageUrl && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleApplyTemplateWithMainPhoto}
                                                disabled={isUploadingImage || isUploadingTemplatePhoto}
                                            >
                                                {isUploadingImage ? (
                                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Layers className="size-4 mr-2" />
                                                )}
                                                Use Nominee Photo
                                            </Button>
                                        )}
                                        <input
                                            ref={templatePhotoInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleTemplatePhotoUpload(file);
                                                e.target.value = "";
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => templatePhotoInputRef.current?.click()}
                                            disabled={isUploadingImage || isUploadingTemplatePhoto}
                                        >
                                            {isUploadingTemplatePhoto ? (
                                                <Loader2 className="size-4 mr-2 animate-spin" />
                                            ) : (
                                                <Upload className="size-4 mr-2" />
                                            )}
                                            Upload for Template
                                        </Button>
                                    </div>
                                    {form.finalImage && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setForm(prev => ({ ...prev, finalImage: "" }))}
                                        >
                                            Remove Template
                                        </Button>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Create a template image using the nominee photo or upload a different one
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

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

            {category?.templateImage && uploadedPhotoForTemplate && (
                <TemplateEditor
                    open={templateEditorOpen}
                    onOpenChange={(nextOpen) => {
                        setTemplateEditorOpen(nextOpen);
                        if (!nextOpen) {
                            if (uploadedPhotoForTemplate.startsWith("blob:")) {
                                URL.revokeObjectURL(uploadedPhotoForTemplate);
                            }
                            setUploadedPhotoForTemplate(null);
                        }
                    }}
                    templateImage={category.templateImage}
                    photoImage={uploadedPhotoForTemplate}
                    onSave={handleTemplateEditorSave}
                    isLoading={isUploadingImage}
                />
            )}
        </>
    );
}
