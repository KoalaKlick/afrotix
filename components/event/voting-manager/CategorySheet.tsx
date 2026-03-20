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
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Trash2,
    Loader2,
    Upload,
    ImageIcon,
    Clock,
    Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { convertToWebP } from "@/lib/image-utils";
import {
    createCategory,
    updateCategory,
    uploadTemplateImage,
} from "@/lib/actions/voting";
import type { VotingCategory } from "@/lib/types/voting";

export interface CategoryFormData {
    name: string;
    description: string;
    maxVotesPerUser: number;
    allowMultiple: boolean;
    allowPublicNomination: boolean;
    nominationDeadline: string;
    requireApproval: boolean;
}

interface CategorySheetProps {
    readonly eventId: string;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly editingCategory: VotingCategory | null;
    readonly nextOrderIndex: number;
    readonly onCategoryCreated: (category: VotingCategory) => void;
    readonly onCategoryUpdated: (category: VotingCategory) => void;
    readonly trigger?: React.ReactNode;
}

export function CategorySheet({
    eventId,
    open,
    onOpenChange,
    editingCategory,
    nextOrderIndex,
    onCategoryCreated,
    onCategoryUpdated,
    trigger,
}: CategorySheetProps) {
    const [form, setForm] = useState<CategoryFormData>({
        name: "",
        description: "",
        maxVotesPerUser: 1,
        allowMultiple: false,
        allowPublicNomination: false,
        nominationDeadline: "",
        requireApproval: true,
    });
    const [isPending, startTransition] = useTransition();

    const resetForm = useCallback(() => {
        setForm({
            name: "",
            description: "",
            maxVotesPerUser: 1,
            allowMultiple: false,
            allowPublicNomination: false,
            nominationDeadline: "",
            requireApproval: true,
        });
    }, []);

    useEffect(() => {
        if (!open) return;

        if (editingCategory) {
            setForm({
                name: editingCategory.name,
                description: editingCategory.description ?? "",
                maxVotesPerUser: editingCategory.maxVotesPerUser,
                allowMultiple: editingCategory.allowMultiple,
                allowPublicNomination: editingCategory.allowPublicNomination,
                nominationDeadline: editingCategory.nominationDeadline
                    ? new Date(editingCategory.nominationDeadline).toISOString().slice(0, 16)
                    : "",
                requireApproval: editingCategory.requireApproval,
            });
            return;
        }

        resetForm();
    }, [editingCategory, open, resetForm]);

    function handleSave() {
        if (!form.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        startTransition(async () => {
            if (editingCategory) {
                const result = await updateCategory(editingCategory.id, {
                    name: form.name,
                    description: form.description || undefined,
                    maxVotesPerUser: form.maxVotesPerUser,
                    allowMultiple: form.allowMultiple,
                    allowPublicNomination: form.allowPublicNomination,
                    nominationDeadline: form.nominationDeadline || undefined,
                    requireApproval: form.requireApproval,
                });

                if (result.success) {
                    onCategoryUpdated({
                        ...editingCategory,
                        name: form.name,
                        description: form.description || null,
                        maxVotesPerUser: form.maxVotesPerUser,
                        allowMultiple: form.allowMultiple,
                        allowPublicNomination: form.allowPublicNomination,
                        nominationDeadline: form.nominationDeadline || null,
                        requireApproval: form.requireApproval,
                    });
                    toast.success("Category updated");
                    onOpenChange(false);
                    resetForm();
                } else {
                    toast.error(result.error);
                }

                return;
            }

            const result = await createCategory(eventId, {
                name: form.name,
                description: form.description || undefined,
                maxVotesPerUser: form.maxVotesPerUser,
                allowMultiple: form.allowMultiple,
                allowPublicNomination: form.allowPublicNomination,
                nominationDeadline: form.nominationDeadline || undefined,
                requireApproval: form.requireApproval,
            });

            if (result.success) {
                onCategoryCreated({
                    id: result.data.id,
                    name: form.name,
                    description: form.description || null,
                    maxVotesPerUser: form.maxVotesPerUser,
                    allowMultiple: form.allowMultiple,
                    allowPublicNomination: form.allowPublicNomination,
                    nominationDeadline: form.nominationDeadline || null,
                    requireApproval: form.requireApproval,
                    orderIdx: nextOrderIndex,
                    votingOptions: [],
                    customFields: [],
                });
                toast.success("Category created");
                onOpenChange(false);
                resetForm();
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={(o) => {
            onOpenChange(o);
            if (!o) resetForm();
        }}>
            {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
            <SheetContent side="right" variant="afro" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        {editingCategory ? "Edit Category" : "Add Category"}
                    </SheetTitle>
                    <SheetDescription>
                        Create a voting category for nominees
                    </SheetDescription>
                </SheetHeader>
                <SheetBody>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList variant="afro" className="grid w-full grid-cols-2">
                            <TabsTrigger value="basic">Basic</TabsTrigger>
                            <TabsTrigger value="nominations">Nominations</TabsTrigger>
                        </TabsList>

                        {/* Basic Tab */}
                        <TabsContent value="basic" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="category-name">Name *</Label>
                                <Input
                                    id="category-name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm(prev => ({ ...prev, name: e.target.value }))
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
                                        setForm(prev => ({ ...prev, description: e.target.value }))
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
                                        setForm(prev => ({
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
                                        setForm(prev => ({ ...prev, allowMultiple: checked }))
                                    }
                                />
                            </div>
                        </TabsContent>

                        {/* Nominations Tab */}
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
                                        setForm(prev => ({ ...prev, allowPublicNomination: checked }))
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
                                                setForm(prev => ({ ...prev, nominationDeadline: e.target.value }))
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
                                                setForm(prev => ({ ...prev, requireApproval: checked }))
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
