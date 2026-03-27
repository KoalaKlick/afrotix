/**
 * Voting Manager Component
 * Manages voting categories and nominees for an event
 */

"use client";

import { useState, useTransition, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Trash2,
    Pencil,
    Users,
    Loader2,
    GripVertical,
    Vote,
    Globe,
    Settings,
} from "lucide-react";

import { CategoryList } from "./voting-manager/CategoryList";

import {
    createCategory,
    updateCategory,
    deleteCategory,
    createOption,
    updateOption,
    deleteOption,
    createCategoryField,
    updateCategoryField,
    deleteCategoryField,
    approveNominationAction,
    rejectNominationAction,
    reorderCategories,
} from "@/lib/actions/voting";

import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NomineeCard } from "./NomineeCard";
import { ConfirmDiscardDialog } from "@/components/common/ConfirmDiscardDialog";
import { CategorySheet } from "./voting-manager/CategorySheet";
import { OptionSheet } from "./voting-manager/OptionSheet";
import { NominationRequestsSheet } from "./voting-manager/NominationRequestsSheet";
import {
    FIELD_TYPES,
    type FieldType,
    type CustomField,
    type VotingOptionStatus,
    type VotingOption,
    type VotingCategory,
    getInputType,
} from "@/lib/types/voting";

interface VotingManagerProps {
    readonly eventId: string;
    readonly categories: VotingCategory[];
    readonly canEdit: boolean;
}

// Sortable category item component
interface SortableCategoryItemProps {
    readonly category: VotingCategory;
    readonly canEdit: boolean;
    readonly children: React.ReactNode;
    readonly dragHandleSlot: React.ReactNode;
}

function SortableCategoryItem({ category, canEdit, children, dragHandleSlot }: SortableCategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : 0,
        position: "relative" as const,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="inline-block">
            <TabsTrigger
                value={category.id}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative overflow-hidden h-10 min-w-40 border-t-2 border-x-2 rounded-t-lg",
                    "data-[state=active]:bg-background data-[state=active]:border-primary data-[state=active]:border-b-background",
                    "data-[state=inactive]:bg-muted/30 data-[state=inactive]:border-transparent hover:bg-muted/50",
                    isDragging && "shadow-lg cursor-grabbing"
                )}
            >
                {canEdit && (
                    <div
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 -ml-2 hover:bg-muted/80 rounded transition-colors"
                    >
                        <GripVertical className="size-3 text-muted-foreground" />
                    </div>
                )}
                <span className="truncate flex-1 text-left">{category.name}</span>
                {category.votingOptions.filter(o => o.status === "pending").length > 0 && (
                    <span className="flex h-2 w-2 rounded-full bg-destructive" />
                )}

                {/* Visual Excel Sheet indicator line */}
                <div className={cn(
                    "absolute bottom-0 left-0 right-0 h-1 transition-opacity",
                    "data-[state=active]:opacity-0",
                    "data-[state=inactive]:opacity-100 group-data-[orientation=horizontal]:bg-border"
                )} />
            </TabsTrigger>
        </div>
    );
}

export function VotingManager({ eventId, categories: initialCategories, canEdit }: VotingManagerProps) {
    const [categories, setCategories] = useState(initialCategories);
    const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(
        initialCategories[0]?.id
    );
    const [isPending, startTransition] = useTransition();

    // Pending requests sheet state
    const [requestsSheetOpen, setRequestsSheetOpen] = useState(false);

    // Category dialog state
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<VotingCategory | null>(null);

    // Custom fields dialog state
    const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false);
    const [fieldsCategory, setFieldsCategory] = useState<VotingCategory | null>(null);
    const [fieldForm, setFieldForm] = useState({
        fieldName: "",
        fieldType: "text" as FieldType,
        fieldLabel: "",
        placeholder: "",
        isRequired: false,
        options: "",
    });
    const [editingField, setEditingField] = useState<CustomField | null>(null);

    // Option dialog state
    const [optionDialogOpen, setOptionDialogOpen] = useState(false);
    const [editingOption, setEditingOption] = useState<VotingOption | null>(null);
    const [optionCategoryId, setOptionCategoryId] = useState<string | null>(null);

    // DnD sensors for category reordering
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );


    const handleCategoryCloseAttempt = (open: boolean) => {
        setCategoryDialogOpen(open);
        if (!open) {
            setEditingCategory(null);
        }
    };

    const handleOptionCloseAttempt = (open: boolean) => {
        setOptionDialogOpen(open);
        if (!open) {
            setEditingOption(null);
            setOptionCategoryId(null);
        }
    };

    // Sync categories and ensure active ID is valid
    useEffect(() => {
        setCategories(initialCategories);
        if (initialCategories.length > 0 && (!activeCategoryId || !initialCategories.find(c => c.id === activeCategoryId))) {
            setActiveCategoryId(initialCategories[0].id);
        }
    }, [initialCategories, activeCategoryId]);

    const activeCategory = useMemo(() =>
        categories.find(c => c.id === activeCategoryId),
        [categories, activeCategoryId]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex((item) => item.id === active.id);
            const newIndex = categories.findIndex((item) => item.id === over.id);
            const newItems = arrayMove(categories, oldIndex, newIndex);

            // Optimistically update UI
            setCategories(newItems);

            // Persist the new order
            startTransition(async () => {
                const result = await reorderCategories(eventId, newItems.map((c) => c.id));
                if (!result.success) {
                    toast.error("Failed to save category order");
                    // Revert on error
                    setCategories(categories);
                }
            });
        }
    }


    function handleEditCategory(category: VotingCategory) {
        setEditingCategory(category);
        setCategoryDialogOpen(true);
    }

    function handleDeleteCategory(categoryId: string) {
        startTransition(async () => {
            const result = await deleteCategory(categoryId);
            if (result.success) {
                setCategories(prev => {
                    const filtered = prev.filter(c => c.id !== categoryId);
                    if (activeCategoryId === categoryId) {
                        setActiveCategoryId(filtered[0]?.id);
                    }
                    return filtered;
                });
                toast.success("Category deleted");
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleOpenAddOption(categoryId: string) {
        setOptionCategoryId(categoryId);
        setEditingOption(null);
        setOptionDialogOpen(true);
    }

    function handleEditOption(option: VotingOption, categoryId: string) {
        setEditingOption(option);
        setOptionCategoryId(categoryId);
        setOptionDialogOpen(true);
    }

    function handleDeleteOption(optionId: string) {
        startTransition(async () => {
            const result = await deleteOption(optionId);
            if (result.success) {
                setCategories(prev =>
                    prev.map(c => ({
                        ...c,
                        votingOptions: c.votingOptions.filter(o => o.id !== optionId),
                    }))
                );
                toast.success("Nominee deleted");
            } else {
                toast.error(result.error);
            }
        });
    }

    // Open custom fields dialog
    function openFieldsDialog(category: VotingCategory) {
        setFieldsCategory(category);
        setFieldsDialogOpen(true);
    }

    function resetFieldForm() {
        setFieldForm({
            fieldName: "",
            fieldType: "text",
            fieldLabel: "",
            placeholder: "",
            isRequired: false,
            options: "",
        });
        setEditingField(null);
    }

    // Handle custom field save
    function handleSaveField() {
        if (!fieldForm.fieldLabel.trim()) {
            toast.error("Field label is required");
            return;
        }

        const fieldName = fieldForm.fieldName.trim() || fieldForm.fieldLabel.toLowerCase().replaceAll(/\s+/g, "_");

        startTransition(async () => {
            if (editingField && fieldsCategory) {
                const result = await updateCategoryField(editingField.id, fieldsCategory.id, {
                    fieldName,
                    fieldType: fieldForm.fieldType,
                    fieldLabel: fieldForm.fieldLabel.trim(),
                    placeholder: fieldForm.placeholder.trim() || undefined,
                    isRequired: fieldForm.isRequired,
                    options: fieldForm.fieldType === "select" && fieldForm.options.trim() ? fieldForm.options.split(",").map(o => o.trim()) : undefined,
                });

                if (result.success) {
                    setCategories(prev =>
                        prev.map(c => {
                            if (c.id === fieldsCategory?.id && c.customFields) {
                                return {
                                    ...c,
                                    customFields: c.customFields.map(f =>
                                        f.id === editingField.id
                                            ? {
                                                ...f,
                                                fieldName,
                                                fieldType: fieldForm.fieldType,
                                                fieldLabel: fieldForm.fieldLabel.trim(),
                                                placeholder: fieldForm.placeholder.trim() || null,
                                                isRequired: fieldForm.isRequired,
                                                options: fieldForm.fieldType === "select" && fieldForm.options.trim()
                                                    ? fieldForm.options.split(",").map(o => o.trim()).filter(Boolean)
                                                    : null,
                                            }
                                            : f
                                    ),
                                };
                            }
                            return c;
                        })
                    );
                    toast.success("Field updated");
                    resetFieldForm();
                } else {
                    toast.error(result.error);
                }
            } else if (fieldsCategory) {
                const result = await createCategoryField(fieldsCategory.id, {
                    fieldName,
                    fieldType: fieldForm.fieldType,
                    fieldLabel: fieldForm.fieldLabel.trim(),
                    placeholder: fieldForm.placeholder.trim() || undefined,
                    isRequired: fieldForm.isRequired,
                    options: fieldForm.fieldType === "select" && fieldForm.options.trim() ? fieldForm.options.split(",").map(o => o.trim()) : undefined,
                });

                if (result.success) {
                    setCategories(prev =>
                        prev.map(c => {
                            if (c.id === fieldsCategory.id) {
                                return {
                                    ...c,
                                    customFields: [
                                        ...(c.customFields ?? []),
                                        {
                                            id: result.data.id,
                                            fieldName,
                                            fieldType: fieldForm.fieldType,
                                            fieldLabel: fieldForm.fieldLabel.trim(),
                                            placeholder: fieldForm.placeholder.trim() || null,
                                            isRequired: fieldForm.isRequired,
                                            options: fieldForm.fieldType === "select" && fieldForm.options.trim()
                                                ? fieldForm.options.split(",").map(o => o.trim()).filter(Boolean)
                                                : null,
                                            orderIdx: c.customFields?.length ?? 0,
                                        },
                                    ],
                                };
                            }
                            return c;
                        })
                    );
                    toast.success("Field added");
                    resetFieldForm();
                } else {
                    toast.error(result.error);
                }
            }
        });
    }

    // Handle custom field delete
    function handleDeleteField(fieldId: string) {
        if (!fieldsCategory) return;
        startTransition(async () => {
            const result = await deleteCategoryField(fieldId, fieldsCategory.id);
            if (result.success) {
                setCategories(prev =>
                    prev.map(c => ({
                        ...c,
                        customFields: c.customFields?.filter(f => f.id !== fieldId),
                    }))
                );
                toast.success("Field deleted");
            } else {
                toast.error(result.error);
            }
        });
    }

    // Handle nomination approval
    function handleApproveNomination(optionId: string) {
        startTransition(async () => {
            const result = await approveNominationAction(optionId);
            if (result.success) {
                setCategories(prev =>
                    prev.map(c => ({
                        ...c,
                        votingOptions: c.votingOptions.map(o =>
                            o.id === optionId ? { ...o, status: "approved" as VotingOptionStatus } : o
                        ),
                    }))
                );
                toast.success("Nomination approved");
            } else {
                toast.error(result.error);
            }
        });
    }

    // Handle nomination rejection
    function handleRejectNomination(optionId: string) {
        startTransition(async () => {
            const result = await rejectNominationAction(optionId);
            if (result.success) {
                setCategories(prev =>
                    prev.map(c => ({
                        ...c,
                        votingOptions: c.votingOptions.map(o =>
                            o.id === optionId ? { ...o, status: "rejected" as VotingOptionStatus } : o
                        ),
                    }))
                );
                toast.success("Nomination rejected");
            } else {
                toast.error(result.error);
            }
        });
    }

    // Get current category for option dialog
    const currentCategory = optionCategoryId ? categories.find(c => c.id === optionCategoryId) : null;

    return (
        <div className="space-y-4 @container">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold flex items-center gap-2">
                        <Vote className="size-5" />
                        Voting Categories
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {categories.length} {categories.length === 1 ? "category" : "categories"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {canEdit && (() => {
                        const pendingCount = categories.reduce((sum, cat) =>
                            sum + cat.votingOptions.filter(o => o.status === "pending").length, 0);

                        if (pendingCount > 0) {
                            return (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="relative mr-2"
                                    onClick={() => setRequestsSheetOpen(true)}
                                >
                                    <span className="absolute -top-1 -right-1 flex size-3">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                                        <span className="relative inline-flex size-3 rounded-full bg-destructive"></span>
                                    </span>
                                    Requests
                                    <Badge variant="secondary" className="ml-2 bg-destructive/10 text-destructive hover:bg-destructive/20">
                                        {pendingCount}
                                    </Badge>
                                </Button>
                            );
                        }
                        return null;
                    })()}
                    <Button
                        size="sm"
                        onClick={() => {
                            setEditingCategory(null);
                            setCategoryDialogOpen(true);
                        }}
                    >
                        <Plus className="size-4 mr-2" />
                        Add Category
                    </Button>
                </div>
            </div>

            {/* Categories Tabs and Nominees */}
            <CategoryList
                eventId={eventId}
                categories={categories}
                setCategories={setCategories}
                activeCategoryId={activeCategoryId}
                setActiveCategoryId={setActiveCategoryId}
                canEdit={canEdit}
                onEditCategory={handleEditCategory}
                onAddOption={handleOpenAddOption}
                onOpenFields={openFieldsDialog}
                onEditOption={handleEditOption}
                onDeleteOption={handleDeleteOption}
                onAddFirst={() => setCategoryDialogOpen(true)}
            />

            {/* Option Sheet */}
            <OptionSheet
                eventId={eventId}
                open={optionDialogOpen}
                onOpenChange={handleOptionCloseAttempt}
                category={categories.find(c => c.id === optionCategoryId) ?? null}
                editingOption={editingOption}
                onOptionCreated={(catId, newOption) => {
                    setCategories(prev =>
                        prev.map(c => c.id === catId ? { ...c, votingOptions: [...c.votingOptions, newOption] } : c)
                    );
                }}
                onOptionUpdated={(updatedOption) => {
                    setCategories(prev =>
                        prev.map(c => ({
                            ...c,
                            votingOptions: c.votingOptions.map(o => o.id === updatedOption.id ? updatedOption : o)
                        }))
                    );
                }}
            />

            {/* Custom Fields Sheet */}
            <Sheet open={fieldsDialogOpen} onOpenChange={(open) => {
                setFieldsDialogOpen(open);
                if (!open) {
                    resetFieldForm();
                    setFieldsCategory(null);
                }
            }}>
                <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col h-full">
                    <SheetHeader className="shrink-0">
                        <SheetTitle>
                            Custom Fields for {fieldsCategory?.name}
                        </SheetTitle>
                        <SheetDescription>
                            Define additional fields that nominees can fill out
                        </SheetDescription>
                    </SheetHeader>
                    <SheetBody className="space-y-4 flex-1 overflow-y-auto pr-2">
                        {/* Existing Fields */}
                        {fieldsCategory && fieldsCategory.customFields && fieldsCategory.customFields.length > 0 && (
                            <div className="space-y-2">
                                <Label>Current Fields</Label>
                                <div className="space-y-2">
                                    {fieldsCategory.customFields.map((field) => (
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
                                                    onClick={() => {
                                                        setEditingField(field);
                                                        setFieldForm({
                                                            fieldName: field.fieldName,
                                                            fieldType: field.fieldType,
                                                            fieldLabel: field.fieldLabel,
                                                            placeholder: field.placeholder ?? "",
                                                            isRequired: field.isRequired,
                                                            options: field.options?.join(", ") ?? "",
                                                        });
                                                    }}
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
                                                                onClick={() => handleDeleteField(field.id)}
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
                        )}

                        <Separator />

                        {/* Add/Edit Field Form */}
                        <div className="space-y-4">
                            <Label>{editingField ? "Edit Field" : "Add New Field"}</Label>

                            <div className="space-y-2">
                                <Label htmlFor="field-label">Label *</Label>
                                <Input
                                    id="field-label"
                                    value={fieldForm.fieldLabel}
                                    onChange={(e) =>
                                        setFieldForm(prev => ({ ...prev, fieldLabel: e.target.value }))
                                    }
                                    placeholder="e.g., Company Name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="field-type">Field Type</Label>
                                <Select
                                    value={fieldForm.fieldType}
                                    onValueChange={(value: FieldType) =>
                                        setFieldForm(prev => ({ ...prev, fieldType: value }))
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

                            {fieldForm.fieldType === "select" && (
                                <div className="space-y-2">
                                    <Label htmlFor="field-options">Options (comma-separated)</Label>
                                    <Input
                                        id="field-options"
                                        value={fieldForm.options}
                                        onChange={(e) =>
                                            setFieldForm(prev => ({ ...prev, options: e.target.value }))
                                        }
                                        placeholder="Option 1, Option 2, Option 3"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="field-placeholder">Placeholder</Label>
                                <Input
                                    id="field-placeholder"
                                    value={fieldForm.placeholder}
                                    onChange={(e) =>
                                        setFieldForm(prev => ({ ...prev, placeholder: e.target.value }))
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
                                    checked={fieldForm.isRequired}
                                    onCheckedChange={(checked) =>
                                        setFieldForm(prev => ({ ...prev, isRequired: checked }))
                                    }
                                />
                            </div>

                            <div className="flex gap-2">
                                {editingField && (
                                    <Button
                                        variant="outline"
                                        onClick={resetFieldForm}
                                    >
                                        Cancel Edit
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSaveField}
                                    disabled={isPending || !fieldForm.fieldLabel.trim()}
                                >
                                    {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    {editingField ? "Update Field" : "Add Field"}
                                </Button>
                            </div>
                        </div>
                    </SheetBody>
                    <SheetFooter className="shrink-0 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setFieldsDialogOpen(false);
                                resetFieldForm();
                                setFieldsCategory(null);
                            }}
                        >
                            Done
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            <NominationRequestsSheet
                open={requestsSheetOpen}
                onOpenChange={setRequestsSheetOpen}
                categories={categories}
                onApprove={handleApproveNomination}
                onReject={handleRejectNomination}
                isPending={isPending}
            />
        </div>
    );
}
