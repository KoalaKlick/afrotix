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
import { Loader2, Clock, Globe } from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/lib/actions/voting";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { getCategoryTemplateImageUrl } from "@/lib/image-url-utils";
import { ImageDropzone } from "@/components/shared/ImageDropzone";
import type { VotingCategory } from "@/lib/types/voting";

export interface CategoryFormData {
    name: string;
    description: string;
    maxVotesPerUser: number;
    allowMultiple: boolean;
    allowPublicNomination: boolean;
    nominationDeadline: string;
    requireApproval: boolean;
    /** Storage path (not full URL) — mirrors what the DB stores. */
    templateImage?: string | null;
}

interface CategorySheetProps {
    readonly eventId: string;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly trigger?: React.ReactNode;
    readonly editingCategory?: VotingCategory | null;
    readonly onCategoryCreated: (category: VotingCategory) => void;
    readonly onCategoryUpdated: (category: VotingCategory) => void;
    readonly nextOrderIndex?: number;
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
}: CategorySheetProps) {
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
    const { isUploading, upload } = useImageUpload({
        bucket: "events",
        folder: "templates",
        convertOptions: { quality: 0.85, maxWidth: 1200, maxHeight: 630, maxSizeMB: 2 },
    });

    const resetForm = useCallback(() => setForm(EMPTY_FORM), []);

    useEffect(() => {
        if (open && editingCategory) {
            setForm({
                name: editingCategory.name,
                description: editingCategory.description ?? "",
                maxVotesPerUser: editingCategory.maxVotesPerUser,
                allowMultiple: editingCategory.allowMultiple,
                allowPublicNomination: editingCategory.allowPublicNomination,
                nominationDeadline: editingCategory.nominationDeadline ?? "",
                requireApproval: editingCategory.requireApproval,
                templateImage: editingCategory.templateImage ?? null,
            });
        } else if (!open) {
            resetForm();
        }
    }, [open, editingCategory, resetForm]);

    const handleSave = () => {
        if (!form.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        startTransition(async () => {
            const payload = {
                name: form.name,
                description: form.description || undefined,
                maxVotesPerUser: form.maxVotesPerUser,
                allowMultiple: form.allowMultiple,
                allowPublicNomination: form.allowPublicNomination,
                nominationDeadline: form.nominationDeadline || undefined,
                requireApproval: form.requireApproval,
                templateImage: form.templateImage || undefined,
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
                        templateImage: form.templateImage || null,
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
                    nominationDeadline: form.nominationDeadline || null,
                    templateImage: form.templateImage || null,
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
        form.templateImage && templateDisplayUrl
            ? [{ id: form.templateImage, url: templateDisplayUrl, name: "Template image" }]
            : [];

    return (
        <Sheet
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) resetForm();
            }}
        >
            {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

            <SheetContent side="right" variant="afro" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{editingCategory ? "Edit Category" : "Add Category"}</SheetTitle>
                    <SheetDescription>Create or edit a voting category for nominees</SheetDescription>
                </SheetHeader>

                <SheetBody>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList variant="afro" className="grid w-full grid-cols-2">
                            <TabsTrigger value="basic">Basic</TabsTrigger>
                            <TabsTrigger value="nominations">Nominations</TabsTrigger>
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
                                    onRemoveInitialFile={() =>
                                        setForm((prev) => ({ ...prev, templateImage: null }))
                                    }
                                    getDisplayUrl={getCategoryTemplateImageUrl}
                                    onDropFile={async (file) => {
                                        const path = await upload(file, form.templateImage);
                                        if (!path) {
                                            return { status: "error", error: "Upload failed" };
                                        }
                                        console.log("Upload successful:", path);
                                        setForm((prev) => ({ ...prev, templateImage: path }));
                                        console.log("Updated form state with templateImage:", form.templateImage);
                                        return { status: "success", result: path };
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
                    </Tabs>
                </SheetBody>

                <SheetFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            resetForm();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                        {editingCategory ? "Save Changes" : "Add Category"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}