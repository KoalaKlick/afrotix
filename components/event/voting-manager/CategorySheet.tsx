"use client";

import { useEffect, useTransition, useCallback, useState } from "react";
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
    SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Clock, Globe, Hash } from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/lib/actions/voting";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { getCategoryTemplateImageUrl } from "@/lib/image-url-utils";
import { ImageDropzone } from "@/components/shared/ImageDropzone";
import { ConfirmDiscardDialog } from "@/components/common/ConfirmDiscardDialog";
import type { VotingCategory, CategoryFormData } from "@/lib/types/voting";

interface CategorySheetProps {
    readonly eventId: string;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly trigger?: React.ReactNode;
    readonly editingCategory?: VotingCategory | null;
    readonly onCategoryCreated: (category: VotingCategory) => void;
    readonly onCategoryUpdated: (category: VotingCategory) => void;
    readonly nextOrderIndex?: number;
    readonly votingMode?: string | null;
}

const EMPTY_FORM: CategoryFormData = {
    name: "",
    description: "",
    maxVotesPerUser: 1,
    allowMultiple: false,
    allowPublicNomination: false,
    nominationDeadline: "",
    requireApproval: false,
    templateImage: null,
    nominationPrice: 0,
    votePrice: 0,
    showFinalImage: true,
    showTotalVotesPublicly: true,
};

export function CategorySheet({
    eventId,
    open,
    onOpenChange,
    trigger,
    editingCategory,
    onCategoryCreated,
    onCategoryUpdated,
    nextOrderIndex = 0,
    votingMode,
}: CategorySheetProps) {
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const { isUploading, upload } = useImageUpload({
        bucket: "events",
        folder: "templates",
        convertOptions: { quality: 0.85, maxWidth: 1200, maxHeight: 630, maxSizeMB: 2 },
    });

    const resetForm = useCallback(() => {
        setForm(EMPTY_FORM);
        setPendingFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    }, [previewUrl, votingMode]);

    useEffect(() => {
        if (open && editingCategory) {
            setForm({
                name: editingCategory.name,
                description: editingCategory.description ?? "",
                maxVotesPerUser: editingCategory.maxVotesPerUser,
                allowMultiple: editingCategory.allowMultiple,
                allowPublicNomination: editingCategory.allowPublicNomination,
                nominationDeadline: editingCategory.nominationDeadline
                    ? (typeof editingCategory.nominationDeadline === 'string'
                        ? editingCategory.nominationDeadline.slice(0, 16)
                        : editingCategory.nominationDeadline.toISOString().slice(0, 16))
                    : "",
                requireApproval: editingCategory.requireApproval,
                templateConfig: editingCategory.templateConfig ?? null,
                showFinalImage: editingCategory.showFinalImage ?? true,
                showTotalVotesPublicly: editingCategory.showTotalVotesPublicly ?? true,
                nominationPrice: Number(editingCategory.nominationPrice) || 0,
                votePrice: Number(editingCategory.votePrice) || (votingMode === "public" ? 0.1 : 0),
            });
        } else if (!open) {
            resetForm();
        }
    }, [open, editingCategory, resetForm]);

    const initialDeadline = editingCategory?.nominationDeadline
        ? (typeof editingCategory.nominationDeadline === 'string'
            ? editingCategory.nominationDeadline.slice(0, 16)
            : editingCategory.nominationDeadline.toISOString().slice(0, 16))
        : "";

    const isDirty =
        form.name !== (editingCategory?.name ?? "") ||
        form.description !== (editingCategory?.description ?? "") ||
        form.maxVotesPerUser !== (editingCategory?.maxVotesPerUser ?? 1) ||
        form.allowMultiple !== (editingCategory?.allowMultiple ?? false) ||
        form.allowPublicNomination !== (editingCategory?.allowPublicNomination ?? false) ||
        form.requireApproval !== (editingCategory?.requireApproval ?? false) ||
        form.showFinalImage !== (editingCategory?.showFinalImage ?? true) ||
        form.showTotalVotesPublicly !== (editingCategory?.showTotalVotesPublicly ?? true) ||
        form.nominationDeadline !== initialDeadline ||
        form.nominationPrice !== (Number(editingCategory?.nominationPrice) || 0) ||
        form.votePrice !== (Number(editingCategory?.votePrice) || 0) ||
        pendingFile !== null;

    const handleCloseAttempt = (newOpen: boolean) => {
        if (!newOpen && isDirty) {
            setShowDiscardDialog(true);
        } else {
            onOpenChange(newOpen);
            if (!newOpen) resetForm();
        }
    };

    const handleSave = () => {
        if (!form.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        if (votingMode === "public" && form.votePrice < 0.1) {
            toast.error("Public events require a minimum vote price of 0.10 GHS");
            return;
        }

        startTransition(async () => {
            // Determine the final image URL:
            // 1. If we have a NEW file to upload, we'll set it after uploading.
            // 2. If no new file AND no existing image path, it means image was removed -> null.
            // 3. If no new file but we HAVE an existing image path, it stays as is.
            let finalImageUrl: string | null | undefined = form.templateImage || (pendingFile ? undefined : null);

            // Step 1: Upload pending file if it exists
            if (pendingFile) {
                const uploadedPath = await upload(pendingFile, form.templateImage || undefined);
                if (!uploadedPath) {
                    toast.error("Failed to upload image");
                    return;
                }
                finalImageUrl = uploadedPath;
            }

            const payload = {
                name: form.name,
                description: form.description || undefined,
                maxVotesPerUser: form.maxVotesPerUser,
                allowMultiple: form.allowMultiple,
                allowPublicNomination: form.allowPublicNomination,
                nominationDeadline: form.nominationDeadline || undefined,
                templateImage: finalImageUrl,
                templateConfig: form.templateConfig || undefined,
                showFinalImage: form.showFinalImage,
                showTotalVotesPublicly: form.showTotalVotesPublicly,
                nominationPrice: votingMode === "internal" ? 0 : form.nominationPrice,
                votePrice: votingMode === "internal" ? 0 : form.votePrice,
            };

            if (editingCategory) {
                console.log("form payload", payload);
                const result = await updateCategory(editingCategory.id, payload);
                console.log("Update category result:", result);
                if (result.success) {
                    onCategoryUpdated({
                        ...editingCategory,
                        ...payload,
                        description: form.description || null,
                        nominationDeadline: form.nominationDeadline || null,
                        templateImage: finalImageUrl || null,
                    });
                    toast.success("Category updated");
                    onOpenChange(false);
                } else {
                    toast.error(result.error ?? "Failed to update category");
                }
                return;
            }

            const result = await createCategory(eventId, payload);
            if (result.success) {
                onCategoryCreated({
                    id: result.data.id,
                    ...payload,
                    description: form.description || null,
                    requireApproval: form.requireApproval,
                    nominationDeadline: form.nominationDeadline || null,
                    templateImage: finalImageUrl || null,
                    showTotalVotesPublicly: form.showTotalVotesPublicly,
                    orderIdx: nextOrderIndex,
                    votingOptions: [],
                    customFields: [],
                });
                toast.success("Category created");
                onOpenChange(false);
            } else {
                toast.error(result.error ?? "Failed to create category");
            }
        });
    };

    // `id` = storage path (key + what gets passed to onRemoveInitialFile)
    // `url` = full public URL for display only
    const templateDisplayUrl = getCategoryTemplateImageUrl(form.templateImage);
    const initialFiles =
        (previewUrl || (form.templateImage && templateDisplayUrl))
            ? [{ 
                id: pendingFile ? "pending" : (form.templateImage || "initial"), 
                url: previewUrl || templateDisplayUrl || "", 
                name: pendingFile ? pendingFile.name : "Template image" 
            }]
            : [];

    return (
        <Sheet
            open={open}
            onOpenChange={handleCloseAttempt}
        >
            {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

            <SheetContent side="right" variant="afro" className="w-full sm:max-w-lg flex flex-col h-full">
                <SheetHeader className="shrink-0">
                    <SheetTitle>{editingCategory ? "Edit Category" : "Add Category"}</SheetTitle>
                    <SheetDescription>Create or edit a voting category for nominees</SheetDescription>
                </SheetHeader>

                <SheetBody className="flex-1 overflow-y-auto pr-2">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList variant="afro" className={`grid w-full ${votingMode === "internal" ? "grid-cols-2" : "grid-cols-3"}`}>
                            <TabsTrigger value="basic">Basic</TabsTrigger>
                            <TabsTrigger value="nominations">Nominations</TabsTrigger>
                            {votingMode !== "internal" && (
                                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                            )}
                        </TabsList>

                        {/* ── Basic Tab ── */}
                        <TabsContent value="basic" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Category Template Image</Label>
                                <ImageDropzone
                                    maxFiles={1}
                                    gridCols="grid-cols-1"
                                    uploadLabel="Upload template image"
                                    uploadSubLabel="Click or drag and drop to upload"
                                    initialFiles={initialFiles}
                                    onRemoveInitialFile={() => {
                                        setForm((prev) => ({ ...prev, templateImage: null }));
                                        setPendingFile(null);
                                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                                        setPreviewUrl(null);
                                    }}
                                    getDisplayUrl={getCategoryTemplateImageUrl}
                                    onDropFile={async (file) => {
                                        // Store file locally and create preview
                                        setPendingFile(file);
                                        const url = URL.createObjectURL(file);
                                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                                        setPreviewUrl(url);

                                        return { status: "success", result: url };
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category-name">Name *</Label>
                                <Input
                                    id="category-name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="e.g., Best Actor"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category-description">Description</Label>
                                <Textarea
                                    id="category-description"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                    placeholder="Describe this category..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max-votes">Max Votes Per User</Label>
                                <Input
                                    id="max-votes"
                                    type="number"
                                    min={1}
                                    value={form.maxVotesPerUser}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            maxVotesPerUser: Number.parseInt(e.target.value) || 1,
                                        }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Allow Multiple Selections</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Users can vote for multiple nominees
                                    </p>
                                </div>
                                <Switch
                                    checked={form.allowMultiple}
                                    onCheckedChange={(checked) =>
                                        setForm((prev) => ({ ...prev, allowMultiple: checked }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Make Vote Counts Public</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show nominee vote totals to public visitors
                                    </p>
                                </div>
                                <Switch
                                    checked={form.showTotalVotesPublicly}
                                    onCheckedChange={(checked) =>
                                        setForm((prev) => ({ ...prev, showTotalVotesPublicly: checked }))
                                    }
                                />
                            </div>
                        </TabsContent>

                        {/* ── Nominations Tab ── */}
                        <TabsContent value="nominations" className="space-y-4 py-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="flex items-center gap-2">
                                        <Globe className="size-4" />
                                        Allow Public Nominations
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Anyone can nominate for this category
                                    </p>
                                </div>
                                <Switch
                                    checked={form.allowPublicNomination}
                                    onCheckedChange={(checked) =>
                                        setForm((prev) => ({ ...prev, allowPublicNomination: checked }))
                                    }
                                />
                            </div>

                            {form.allowPublicNomination && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="nomination-deadline" className="flex items-center gap-2">
                                            <Clock className="size-4" />
                                            Nomination Deadline
                                        </Label>
                                        <Input
                                            id="nomination-deadline"
                                            type="datetime-local"
                                            value={form.nominationDeadline}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    nominationDeadline: e.target.value,
                                                }))
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave empty for no deadline
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Require Approval</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Review nominations before publishing
                                            </p>
                                        </div>
                                        <Switch
                                            checked={form.requireApproval}
                                            onCheckedChange={(checked) =>
                                                setForm((prev) => ({ ...prev, requireApproval: checked }))
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        {/* ── Pricing Tab ── */}
                        <TabsContent value="pricing" className="space-y-4 py-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nomination-price" className="flex items-center gap-2">
                                        <Hash className="size-4" />
                                        Nominee Fee (GHS)
                                    </Label>
                                    <Input
                                        id="nomination-price"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={form.nominationPrice}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                nominationPrice: Number.parseFloat(e.target.value) || 0,
                                            }))
                                        }
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Amount a person pays to become a nominee in this category.
                                    </p>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="vote-price" className="flex items-center gap-2">
                                        <Hash className="size-4" />
                                        Price Per Vote (GHS)
                                    </Label>
                                    <Input
                                        id="vote-price"
                                        type="number"
                                        min={votingMode === "public" ? 0.1 : 0}
                                        step="0.01"
                                        value={form.votePrice}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                votePrice: Number.parseFloat(e.target.value) || 0,
                                            }))
                                        }
                                        placeholder={votingMode === "public" ? "0.10" : "0.00"}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Amount a voter pays for each vote cast in this category.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </SheetBody>

                <SheetFooter className="shrink-0 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            resetForm();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button variant='tertiary' onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                        {editingCategory ? "Save Changes" : "Add Category"}
                    </Button>
                </SheetFooter>

                <ConfirmDiscardDialog
                    open={showDiscardDialog}
                    onOpenChange={setShowDiscardDialog}
                    onConfirm={() => {
                        setShowDiscardDialog(false);
                        onOpenChange(false);
                        resetForm();
                    }}
                />
            </SheetContent>
        </Sheet>
    );
}