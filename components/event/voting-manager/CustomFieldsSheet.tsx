"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState, useTransition, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetBody,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import {
    FIELD_TYPES,
    type FieldType,
    type CustomField,
    type VotingCategory,
} from "@/lib/types/voting";
import { toast } from "sonner";
import {
    createCategoryField,
    updateCategoryField,
    deleteCategoryField,
} from "@/lib/actions/voting";
export interface FieldFormData {
    fieldName: string;
    fieldType: FieldType;
    fieldLabel: string;
    placeholder: string;
    isRequired: boolean;
    options: string;
}

interface CustomFieldsSheetProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly category: VotingCategory | null;
    readonly onClose: () => void;
    readonly onFieldCreated: (categoryId: string, field: CustomField) => void;
    readonly onFieldUpdated: (categoryId: string, field: CustomField) => void;
    readonly onFieldDeleted: (categoryId: string, fieldId: string) => void;
}

export function CustomFieldsSheet({
    open,
    onOpenChange,
    category,
    onClose,
    onFieldCreated,
    onFieldUpdated,
    onFieldDeleted,
}: CustomFieldsSheetProps) {
    const [form, setForm] = useState<FieldFormData>({
        fieldName: "",
        fieldType: "text",
        fieldLabel: "",
        placeholder: "",
        isRequired: false,
        options: "",
    });
    const [editingField, setEditingField] = useState<CustomField | null>(null);
    const [isPending, startTransition] = useTransition();

    const resetForm = useCallback(() => {
        setForm({
            fieldName: "",
            fieldType: "text",
            fieldLabel: "",
            placeholder: "",
            isRequired: false,
            options: "",
        });
        setEditingField(null);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        resetForm();
    }, [open, resetForm]);

    function handleEditField(field: CustomField) {
        setEditingField(field);
        setForm({
            fieldName: field.fieldName,
            fieldType: field.fieldType,
            fieldLabel: field.fieldLabel,
            placeholder: field.placeholder ?? "",
            isRequired: field.isRequired,
            options: field.options?.join(", ") ?? "",
        });
    }

    async function saveExistingField(category: VotingCategory, fieldName: string) {
        if (!editingField) {
            return;
        }

        const result = await updateCategoryField(editingField.id, category.id, {
            fieldName,
            fieldType: form.fieldType,
            fieldLabel: form.fieldLabel.trim(),
            placeholder: form.placeholder.trim() || undefined,
            isRequired: form.isRequired,
            options: form.fieldType === "select" && form.options.trim()
                ? form.options.split(",").map(option => option.trim())
                : undefined,
        });

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        onFieldUpdated(category.id, {
            ...editingField,
            fieldName,
            fieldType: form.fieldType,
            fieldLabel: form.fieldLabel.trim(),
            placeholder: form.placeholder.trim() || null,
            isRequired: form.isRequired,
            options: form.fieldType === "select" && form.options.trim()
                ? form.options.split(",").map(option => option.trim())
                : null,
        });
        toast.success("Field updated");
        resetForm();
    }

    async function saveNewField(category: VotingCategory, fieldName: string) {
        const result = await createCategoryField(category.id, {
            fieldName,
            fieldType: form.fieldType,
            fieldLabel: form.fieldLabel.trim(),
            placeholder: form.placeholder.trim() || undefined,
            isRequired: form.isRequired,
            options: form.fieldType === "select" && form.options.trim()
                ? form.options.split(",").map(option => option.trim())
                : undefined,
        });

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        onFieldCreated(category.id, {
            id: result.data.id,
            fieldName,
            fieldType: form.fieldType,
            fieldLabel: form.fieldLabel.trim(),
            placeholder: form.placeholder.trim() || null,
            isRequired: form.isRequired,
            options: form.fieldType === "select" && form.options.trim()
                ? form.options.split(",").map(option => option.trim())
                : null,
            orderIdx: category.customFields?.length ?? 0,
        });
        toast.success("Field added");
        resetForm();
    }

    function handleSave() {
        if (!category) {
            return;
        }

        if (!form.fieldLabel.trim()) {
            toast.error("Field label is required");
            return;
        }

        const fieldName = form.fieldName.trim() || form.fieldLabel.toLowerCase().replaceAll(/\s+/g, "_");

        startTransition(async () => {
            if (editingField) {
                await saveExistingField(category, fieldName);
                return;
            }

            await saveNewField(category, fieldName);
        });
    }

    function handleDelete(fieldId: string) {
        if (!category) {
            return;
        }

        startTransition(async () => {
            const result = await deleteCategoryField(fieldId, category.id);
            if (result.success) {
                onFieldDeleted(category.id, fieldId);
                toast.success("Field deleted");
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={(o) => {
            onOpenChange(o);
            if (!o) onClose();
        }}>
            <SheetContent side="right" variant="afro" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        Custom Fields for {category?.name}
                    </SheetTitle>
                    <SheetDescription>
                        Define additional fields that nominees can fill out
                    </SheetDescription>
                </SheetHeader>
                <SheetBody className="space-y-4">
                    {/* Existing Fields */}
                    {category?.customFields?.length ? (
                        <div className="space-y-2">
                            <Label>Current Fields</Label>
                            <div className="space-y-2">
                                {category.customFields.map((field) => (
                                    <div
                                        key={field.id}
                                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{field.fieldLabel}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {FIELD_TYPES.find(t => t.value === field.fieldType)?.label ?? field.fieldType}
                                                {field.isRequired && " • Required"}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleEditField(field)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="text-destructive">
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Field?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will remove the field &quot;{field.fieldLabel}&quot; and all its data.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(field.id)}
                                                            className="bg-destructive text-destructive-foreground"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <Separator />

                    {/* Add/Edit Field Form */}
                    <div className="space-y-4">
                        <Label>{editingField ? "Edit Field" : "Add New Field"}</Label>

                        <div className="space-y-2">
                            <Label htmlFor="field-label">Label *</Label>
                            <Input
                                id="field-label"
                                value={form.fieldLabel}
                                onChange={(e) =>
                                    setForm(prev => ({ ...prev, fieldLabel: e.target.value }))
                                }
                                placeholder="e.g., Company Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="field-type">Field Type</Label>
                            <Select
                                value={form.fieldType}
                                onValueChange={(value: FieldType) =>
                                    setForm(prev => ({ ...prev, fieldType: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {form.fieldType === "select" && (
                            <div className="space-y-2">
                                <Label htmlFor="field-options">Options (comma-separated)</Label>
                                <Input
                                    id="field-options"
                                    value={form.options}
                                    onChange={(e) =>
                                        setForm(prev => ({ ...prev, options: e.target.value }))
                                    }
                                    placeholder="Option 1, Option 2, Option 3"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="field-placeholder">Placeholder</Label>
                            <Input
                                id="field-placeholder"
                                value={form.placeholder}
                                onChange={(e) =>
                                    setForm(prev => ({ ...prev, placeholder: e.target.value }))
                                }
                                placeholder="Hint text shown in empty field"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Required Field</Label>
                                <p className="text-sm text-muted-foreground">
                                    Nominees must fill this field
                                </p>
                            </div>
                            <Switch
                                checked={form.isRequired}
                                onCheckedChange={(checked) =>
                                    setForm(prev => ({ ...prev, isRequired: checked }))
                                }
                            />
                        </div>

                        <div className="flex gap-2">
                            {editingField && (
                                <Button
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Cancel Edit
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={isPending || !form.fieldLabel.trim()}
                            >
                                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                {editingField ? "Update Field" : "Add Field"}
                            </Button>
                        </div>
                    </div>
                </SheetBody>
                <SheetFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Done
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
