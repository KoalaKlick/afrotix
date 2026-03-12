/**
 * Voting Manager Component
 * Manages voting categories and nominees for an event
 */

"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
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
    Upload,
    ImageIcon,
    Vote,
    Mail,
    Hash,
    Clock,
    Globe,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Settings,
    FileText,
    Layers,
} from "lucide-react";
import {
    createCategory,
    updateCategory,
    deleteCategory,
    createOption,
    updateOption,
    deleteOption,
    uploadNomineeImage,
    uploadTemplateImage,
    createCategoryField,
    updateCategoryField,
    deleteCategoryField,
    approveNominationAction,
    rejectNominationAction,
    reorderCategories,
} from "@/lib/actions/voting";
import { convertToWebP } from "@/lib/image-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TemplateEditor, type TemplateConfig } from "@/components/shared/template-editor";

// Field type options for custom fields
const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Long Text" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "url", label: "URL" },
    { value: "date", label: "Date" },
    { value: "file", label: "File/Attachment" },
    { value: "select", label: "Dropdown" },
] as const;

type FieldType = typeof FIELD_TYPES[number]["value"];

interface CustomField {
    id: string;
    fieldName: string;
    fieldType: FieldType;
    fieldLabel: string;
    placeholder: string | null;
    isRequired: boolean;
    options: string | null;
    orderIdx: number;
}

interface FieldValue {
    fieldId: string;
    value: string;
}

type VotingOptionStatus = "pending" | "approved" | "rejected";

interface VotingOption {
    id: string;
    optionText: string;
    nomineeCode: string | null;
    email: string | null;
    description: string | null;
    imageUrl: string | null;
    finalImage: string | null;
    status: VotingOptionStatus;
    isPublicNomination: boolean;
    nominatedByName: string | null;
    votesCount: bigint;
    orderIdx: number;
    fieldValues?: FieldValue[];
}

interface VotingCategory {
    id: string;
    name: string;
    description: string | null;
    maxVotesPerUser: number;
    allowMultiple: boolean;
    templateImage: string | null;
    templateConfig: unknown;
    showFinalImage: boolean;
    allowPublicNomination: boolean;
    nominationDeadline: string | Date | null;
    requireApproval: boolean;
    orderIdx: number;
    votingOptions: VotingOption[];
    customFields?: CustomField[];
}

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
        zIndex: isDragging ? 1 : 0,
        position: "relative" as const,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <AccordionItem
                value={category.id}
                className="border rounded-lg bg-card"
            >
                <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                        {canEdit && (
                            <button
                                type="button"
                                {...listeners}
                                className="cursor-grab active:cursor-grabbing touch-none p-1 -m-1 hover:bg-muted rounded"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                            >
                                <GripVertical className="size-4 text-muted-foreground" />
                            </button>
                        )}
                        {dragHandleSlot}
                    </div>
                </AccordionTrigger>
                {children}
            </AccordionItem>
        </div>
    );
}

export function VotingManager({ eventId, categories: initialCategories, canEdit }: VotingManagerProps) {
    const [categories, setCategories] = useState(initialCategories);
    const [isPending, startTransition] = useTransition();

    // Category dialog state
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<VotingCategory | null>(null);
    const [categoryForm, setCategoryForm] = useState({
        name: "",
        description: "",
        maxVotesPerUser: 1,
        allowMultiple: false,
        allowPublicNomination: false,
        nominationDeadline: "",
        requireApproval: true,
        templateImage: "",
        showFinalImage: true,
    });

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
    const [optionForm, setOptionForm] = useState({
        optionText: "",
        nomineeCode: "",
        email: "",
        description: "",
        imageUrl: "",
        finalImage: "",
        fieldValues: [] as { fieldId: string; value: string }[],
    });
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
    const [isUploadingTemplatePhoto, setIsUploadingTemplatePhoto] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const templateInputRef = useRef<HTMLInputElement>(null);
    const templatePhotoInputRef = useRef<HTMLInputElement>(null);

    // Template editor state
    const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
    const [uploadedPhotoForTemplate, setUploadedPhotoForTemplate] = useState<string | null>(null);

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

    // Handle drag end for category reordering
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Persist the new order
                startTransition(async () => {
                    const result = await reorderCategories(eventId, newItems.map((c) => c.id));
                    if (!result.success) {
                        toast.error("Failed to save category order");
                        // Revert on error
                        setCategories(items);
                    }
                });

                return newItems;
            });
        }
    }

    // Reset category form
    function resetCategoryForm() {
        setCategoryForm({
            name: "",
            description: "",
            maxVotesPerUser: 1,
            allowMultiple: false,
            allowPublicNomination: false,
            nominationDeadline: "",
            requireApproval: true,
            templateImage: "",
            showFinalImage: true,
        });
        setEditingCategory(null);
    }

    // Reset field form
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

    // Reset option form
    function resetOptionForm() {
        setOptionForm({
            optionText: "",
            nomineeCode: "",
            email: "",
            description: "",
            imageUrl: "",
            finalImage: "",
            fieldValues: [],
        });
        setEditingOption(null);
        setOptionCategoryId(null);
    }

    // Open category dialog for editing
    function openEditCategory(category: VotingCategory) {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            description: category.description ?? "",
            maxVotesPerUser: category.maxVotesPerUser,
            allowMultiple: category.allowMultiple,
            allowPublicNomination: category.allowPublicNomination,
            nominationDeadline: category.nominationDeadline
                ? new Date(category.nominationDeadline).toISOString().slice(0, 16)
                : "",
            requireApproval: category.requireApproval,
            templateImage: category.templateImage ?? "",
            showFinalImage: category.showFinalImage,
        });
        setCategoryDialogOpen(true);
    }

    // Open custom fields dialog
    function openFieldsDialog(category: VotingCategory) {
        setFieldsCategory(category);
        setFieldsDialogOpen(true);
    }

    // Open option dialog for adding
    function openAddOption(categoryId: string) {
        resetOptionForm();
        setOptionCategoryId(categoryId);
        // Initialize field values for custom fields
        const category = categories.find(c => c.id === categoryId);
        if (category?.customFields) {
            setOptionForm(prev => ({
                ...prev,
                fieldValues: (category.customFields ?? []).map(f => ({ fieldId: f.id, value: "" })),
            }));
        }
        setOptionDialogOpen(true);
    }

    // Open option dialog for editing
    function openEditOption(option: VotingOption, categoryId: string) {
        setEditingOption(option);
        setOptionCategoryId(categoryId);
        const category = categories.find(c => c.id === categoryId);
        setOptionForm({
            optionText: option.optionText,
            nomineeCode: option.nomineeCode ?? "",
            email: option.email ?? "",
            description: option.description ?? "",
            imageUrl: option.imageUrl ?? "",
            finalImage: option.finalImage ?? "",
            fieldValues: category?.customFields?.map(f => ({
                fieldId: f.id,
                value: option.fieldValues?.find(v => v.fieldId === f.id)?.value ?? "",
            })) ?? [],
        });
        setOptionDialogOpen(true);
    }

    // Handle category save
    function handleSaveCategory() {
        if (!categoryForm.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        startTransition(async () => {
            if (editingCategory) {
                const result = await updateCategory(editingCategory.id, {
                    name: categoryForm.name,
                    description: categoryForm.description || undefined,
                    maxVotesPerUser: categoryForm.maxVotesPerUser,
                    allowMultiple: categoryForm.allowMultiple,
                    allowPublicNomination: categoryForm.allowPublicNomination,
                    nominationDeadline: categoryForm.nominationDeadline || undefined,
                    requireApproval: categoryForm.requireApproval,
                    templateImage: categoryForm.templateImage || undefined,
                    showFinalImage: categoryForm.showFinalImage,
                });

                if (result.success) {
                    setCategories(prev =>
                        prev.map(c =>
                            c.id === editingCategory.id
                                ? {
                                    ...c,
                                    name: categoryForm.name,
                                    description: categoryForm.description || null,
                                    maxVotesPerUser: categoryForm.maxVotesPerUser,
                                    allowMultiple: categoryForm.allowMultiple,
                                    allowPublicNomination: categoryForm.allowPublicNomination,
                                    nominationDeadline: categoryForm.nominationDeadline || null,
                                    requireApproval: categoryForm.requireApproval,
                                    templateImage: categoryForm.templateImage || null,
                                    showFinalImage: categoryForm.showFinalImage,
                                }
                                : c
                        )
                    );
                    toast.success("Category updated");
                    setCategoryDialogOpen(false);
                    resetCategoryForm();
                } else {
                    toast.error(result.error);
                }
            } else {
                const result = await createCategory(eventId, {
                    name: categoryForm.name,
                    description: categoryForm.description || undefined,
                    maxVotesPerUser: categoryForm.maxVotesPerUser,
                    allowMultiple: categoryForm.allowMultiple,
                    allowPublicNomination: categoryForm.allowPublicNomination,
                    nominationDeadline: categoryForm.nominationDeadline || undefined,
                    requireApproval: categoryForm.requireApproval,
                    templateImage: categoryForm.templateImage || undefined,
                    showFinalImage: categoryForm.showFinalImage,
                });

                if (result.success) {
                    setCategories(prev => [
                        ...prev,
                        {
                            id: result.data.id,
                            name: categoryForm.name,
                            description: categoryForm.description || null,
                            maxVotesPerUser: categoryForm.maxVotesPerUser,
                            allowMultiple: categoryForm.allowMultiple,
                            templateImage: categoryForm.templateImage || null,
                            templateConfig: null,
                            showFinalImage: categoryForm.showFinalImage,
                            allowPublicNomination: categoryForm.allowPublicNomination,
                            nominationDeadline: categoryForm.nominationDeadline || null,
                            requireApproval: categoryForm.requireApproval,
                            orderIdx: prev.length,
                            votingOptions: [],
                            customFields: [],
                        },
                    ]);
                    toast.success("Category created");
                    setCategoryDialogOpen(false);
                    resetCategoryForm();
                } else {
                    toast.error(result.error);
                }
            }
        });
    }

    // Handle category delete
    function handleDeleteCategory(categoryId: string) {
        startTransition(async () => {
            const result = await deleteCategory(categoryId);
            if (result.success) {
                setCategories(prev => prev.filter(c => c.id !== categoryId));
                toast.success("Category deleted");
            } else {
                toast.error(result.error);
            }
        });
    }

    // Handle template image upload
    async function handleTemplateImageUpload(file: File) {
        setIsUploadingTemplate(true);
        try {
            const optimizedFile = await convertToWebP(file, {
                quality: 0.9,
                maxWidth: 1200,
                maxHeight: 1200,
                maxSizeMB: 5,
            });

            const formData = new FormData();
            formData.set("file", optimizedFile);

            const result = await uploadTemplateImage(formData);
            if (result.success) {
                setCategoryForm(prev => ({ ...prev, templateImage: result.data.url }));
                toast.success("Template uploaded");
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to upload template");
        } finally {
            setIsUploadingTemplate(false);
        }
    }

    // Handle image upload
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

            const result = await uploadNomineeImage(formData);
            if (result.success) {
                // Store original image in imageUrl (template is applied separately)
                setOptionForm(prev => ({ ...prev, imageUrl: result.data.url }));
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

    // Handle template editor save - stores result in finalImage (separate from original imageUrl)
    async function handleTemplateEditorSave(finalImageDataUrl: string, _config: TemplateConfig) {
        setIsUploadingImage(true);
        try {
            // Convert data URL to blob
            const response = await fetch(finalImageDataUrl);
            const blob = await response.blob();
            const file = new File([blob], "template-image.webp", { type: "image/webp" });

            // Upload the final image
            const formData = new FormData();
            formData.set("file", file);

            const result = await uploadNomineeImage(formData);
            if (result.success) {
                setOptionForm(prev => ({
                    ...prev,
                    finalImage: result.data.url, // Store template image separately from original
                }));
                toast.success("Template applied successfully");
                setTemplateEditorOpen(false);
                // Revoke object URL if it was a blob URL
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

    // Open template editor using the main imageUrl
    function handleApplyTemplateWithMainPhoto() {
        if (!optionForm.imageUrl) {
            toast.error("No nominee photo available. Upload a photo or use 'Upload for Template'.");
            return;
        }
        setUploadedPhotoForTemplate(optionForm.imageUrl);
        setTemplateEditorOpen(true);
    }

    // Handle uploading a photo specifically for the template (doesn't affect imageUrl)
    async function handleTemplatePhotoUpload(file: File) {
        setIsUploadingTemplatePhoto(true);
        try {
            const optimizedFile = await convertToWebP(file, {
                quality: 0.85,
                maxWidth: 1200,
                maxHeight: 1200,
                maxSizeMB: 2,
            });

            // Create a temporary URL for the template editor
            const tempUrl = URL.createObjectURL(optimizedFile);
            setUploadedPhotoForTemplate(tempUrl);
            setTemplateEditorOpen(true);
        } catch {
            toast.error("Failed to process image");
        } finally {
            setIsUploadingTemplatePhoto(false);
        }
    }

    // Handle option save
    function handleSaveOption() {
        if (!optionForm.optionText.trim()) {
            toast.error("Nominee name is required");
            return;
        }

        startTransition(async () => {
            if (editingOption) {
                const result = await updateOption(editingOption.id, {
                    optionText: optionForm.optionText,
                    nomineeCode: optionForm.nomineeCode || undefined,
                    email: optionForm.email || undefined,
                    description: optionForm.description || undefined,
                    imageUrl: optionForm.imageUrl || undefined,
                    finalImage: optionForm.finalImage || undefined,
                    fieldValues: optionForm.fieldValues.filter(f => f.value.trim()),
                });

                if (result.success) {
                    setCategories(prev =>
                        prev.map(c => ({
                            ...c,
                            votingOptions: c.votingOptions.map(o =>
                                o.id === editingOption.id
                                    ? {
                                        ...o,
                                        optionText: optionForm.optionText,
                                        nomineeCode: result.data?.nomineeCode ?? o.nomineeCode,
                                        email: optionForm.email || null,
                                        description: optionForm.description || null,
                                        imageUrl: optionForm.imageUrl || null,
                                        finalImage: optionForm.finalImage || null,
                                        fieldValues: optionForm.fieldValues,
                                    }
                                    : o
                            ),
                        }))
                    );
                    toast.success("Nominee updated");
                    setOptionDialogOpen(false);
                    resetOptionForm();
                } else {
                    toast.error(result.error);
                }
            } else if (optionCategoryId) {
                const result = await createOption(eventId, {
                    categoryId: optionCategoryId,
                    optionText: optionForm.optionText,
                    nomineeCode: optionForm.nomineeCode || undefined,
                    email: optionForm.email || undefined,
                    description: optionForm.description || undefined,
                    imageUrl: optionForm.imageUrl || undefined,
                    finalImage: optionForm.finalImage || undefined,
                    fieldValues: optionForm.fieldValues.filter(f => f.value.trim()),
                });

                if (result.success) {
                    setCategories(prev =>
                        prev.map(c => {
                            if (c.id === optionCategoryId) {
                                return {
                                    ...c,
                                    votingOptions: [
                                        ...c.votingOptions,
                                        {
                                            id: result.data.id,
                                            optionText: optionForm.optionText,
                                            nomineeCode: result.data.nomineeCode ?? null,
                                            email: optionForm.email || null,
                                            description: optionForm.description || null,
                                            imageUrl: optionForm.imageUrl || null,
                                            finalImage: optionForm.finalImage || null,
                                            status: "approved" as VotingOptionStatus,
                                            isPublicNomination: false,
                                            nominatedByName: null,
                                            votesCount: BigInt(0),
                                            orderIdx: c.votingOptions.length,
                                            fieldValues: optionForm.fieldValues,
                                        },
                                    ],
                                };
                            }
                            return c;
                        })
                    );
                    toast.success("Nominee added");
                    setOptionDialogOpen(false);
                    resetOptionForm();
                } else {
                    toast.error(result.error);
                }
            }
        });
    }

    // Handle option delete
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
                                                options: fieldForm.fieldType === "select" ? fieldForm.options.trim() || null : null,
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
                                            options: fieldForm.fieldType === "select" ? fieldForm.options.trim() || null : null,
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

    // Get status badge color
    function getStatusBadge(status: VotingOptionStatus) {
        switch (status) {
            case "approved":
                return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="size-3 mr-1" />Approved</Badge>;
            case "pending":
                return <Badge variant="secondary"><AlertCircle className="size-3 mr-1" />Pending</Badge>;
            case "rejected":
                return <Badge variant="destructive"><XCircle className="size-3 mr-1" />Rejected</Badge>;
        }
    }

    // Get input type from field type
    function getInputType(fieldType: FieldType): string {
        switch (fieldType) {
            case "number": return "number";
            case "email": return "email";
            case "url": return "url";
            case "date": return "date";
            default: return "text";
        }
    }

    // Get current category for option dialog
    const currentCategory = optionCategoryId ? categories.find(c => c.id === optionCategoryId) : null;

    return (
        <div className="space-y-4">
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
                {canEdit && (
                    <Sheet open={categoryDialogOpen} onOpenChange={(open) => {
                        setCategoryDialogOpen(open);
                        if (!open) resetCategoryForm();
                    }}>
                        <SheetTrigger asChild>
                            <Button size="sm">
                                <Plus className="size-4 mr-2" />
                                Add Category
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
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
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="basic">Basic</TabsTrigger>
                                        <TabsTrigger value="nominations">Nominations</TabsTrigger>
                                        <TabsTrigger value="template">Template</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="basic" className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category-name">Name *</Label>
                                            <Input
                                                id="category-name"
                                                value={categoryForm.name}
                                                onChange={(e) =>
                                                    setCategoryForm(prev => ({ ...prev, name: e.target.value }))
                                                }
                                                placeholder="e.g., Best Actor"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category-description">Description</Label>
                                            <Textarea
                                                id="category-description"
                                                value={categoryForm.description}
                                                onChange={(e) =>
                                                    setCategoryForm(prev => ({ ...prev, description: e.target.value }))
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
                                                value={categoryForm.maxVotesPerUser}
                                                onChange={(e) =>
                                                    setCategoryForm(prev => ({
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
                                                checked={categoryForm.allowMultiple}
                                                onCheckedChange={(checked) =>
                                                    setCategoryForm(prev => ({ ...prev, allowMultiple: checked }))
                                                }
                                            />
                                        </div>
                                    </TabsContent>
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
                                                checked={categoryForm.allowPublicNomination}
                                                onCheckedChange={(checked) =>
                                                    setCategoryForm(prev => ({ ...prev, allowPublicNomination: checked }))
                                                }
                                            />
                                        </div>
                                        {categoryForm.allowPublicNomination && (
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
                                                        value={categoryForm.nominationDeadline}
                                                        onChange={(e) =>
                                                            setCategoryForm(prev => ({ ...prev, nominationDeadline: e.target.value }))
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
                                                        checked={categoryForm.requireApproval}
                                                        onCheckedChange={(checked) =>
                                                            setCategoryForm(prev => ({ ...prev, requireApproval: checked }))
                                                        }
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="template" className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Nominee Photo Template</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Upload a template image for positioning nominee photos
                                            </p>
                                        </div>
                                        {categoryForm.templateImage ? (
                                            <div className="space-y-3">
                                                <div className="relative aspect-video rounded-lg border overflow-hidden bg-muted">
                                                    <Image
                                                        src={categoryForm.templateImage}
                                                        alt="Template"
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => templateInputRef.current?.click()}
                                                        disabled={isUploadingTemplate}
                                                    >
                                                        {isUploadingTemplate ? (
                                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <Upload className="size-4 mr-2" />
                                                        )}
                                                        Replace
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCategoryForm(prev => ({ ...prev, templateImage: "" }))}
                                                    >
                                                        <Trash2 className="size-4 mr-2" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                tabIndex={0}
                                                onClick={() => templateInputRef.current?.click()}
                                                onKeyDown={(e) => e.key === "Enter" && templateInputRef.current?.click()}
                                                className={cn(
                                                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                                                    "hover:border-primary hover:bg-muted/50",
                                                    isUploadingTemplate && "pointer-events-none opacity-50"
                                                )}
                                            >
                                                {isUploadingTemplate ? (
                                                    <Loader2 className="size-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <ImageIcon className="size-8 mx-auto mb-2 text-muted-foreground" />
                                                )}
                                                <p className="text-sm text-muted-foreground">
                                                    {isUploadingTemplate ? "Uploading..." : "Click to upload template image"}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    PNG, JPG, or WebP (max 10MB)
                                                </p>
                                            </button>
                                        )}
                                        <input
                                            ref={templateInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleTemplateImageUpload(file);
                                                e.target.value = "";
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            When a template is set, nominees can position their photo on it during upload.
                                        </p>
                                        {categoryForm.templateImage && (
                                            <>
                                                <Separator className="my-4" />
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label>Show Template Image on Cards</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Display the combined template image instead of the original photo
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={categoryForm.showFinalImage}
                                                        onCheckedChange={(checked) =>
                                                            setCategoryForm(prev => ({ ...prev, showFinalImage: checked }))
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
                                        setCategoryDialogOpen(false);
                                        resetCategoryForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveCategory} disabled={isPending}>
                                    {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    {editingCategory ? "Save Changes" : "Add Category"}
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                )}
            </div>

            {/* Empty State */}
            {categories.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Vote className="size-12 text-muted-foreground mb-4" />
                        <h4 className="font-medium mb-1">No categories yet</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            Add voting categories to organize your nominees
                        </p>
                        {canEdit && (
                            <Button onClick={() => setCategoryDialogOpen(true)}>
                                <Plus className="size-4 mr-2" />
                                Add First Category
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Categories List */}
            {categories.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={categories.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="space-y-2">
                            {categories.map((category) => {
                                const pendingCount = category.votingOptions.filter(o => o.status === "pending").length;
                                return (
                                    <SortableCategoryItem
                                        key={category.id}
                                        category={category}
                                        canEdit={canEdit}
                                        dragHandleSlot={
                                            <div className="text-left flex-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    {category.name}
                                                    {category.allowPublicNomination && (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Globe className="size-3 mr-1" />
                                                            Public
                                                        </Badge>
                                                    )}
                                                    {pendingCount > 0 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {pendingCount} pending
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {category.votingOptions.filter(o => o.status === "approved").length} nominees
                                                    {category.allowMultiple && " • Multiple selection"}
                                                    {category.customFields && category.customFields.length > 0 && (
                                                        <span> • {category.customFields.length} custom fields</span>
                                                    )}
                                                </div>
                                            </div>
                                        }
                                    >
                                        <AccordionContent className="px-4 pb-4">
                                            {category.description && (
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {category.description}
                                                </p>
                                            )}

                                    {/* Category Actions */}
                                    {canEdit && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditCategory(category)}
                                            >
                                                <Pencil className="size-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openAddOption(category.id)}
                                            >
                                                <Plus className="size-4 mr-2" />
                                                Add Nominee
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openFieldsDialog(category)}
                                            >
                                                <Settings className="size-4 mr-2" />
                                                Custom Fields
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="text-destructive">
                                                        <Trash2 className="size-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will delete the category and all its nominees.
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteCategory(category.id)}
                                                            className="bg-destructive text-destructive-foreground"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}

                                    {/* Nominees Grid */}
                                    {category.votingOptions.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="size-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No nominees yet</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {category.votingOptions.map((option) => {
                                                // Use finalImage if showFinalImage is enabled and it exists, otherwise fall back to imageUrl
                                                const displayImage = (category.showFinalImage && option.finalImage) || option.imageUrl;
                                                return (
                                                    <Card
                                                        key={option.id}
                                                        className={cn(
                                                            "overflow-hidden group",
                                                            option.status === "pending" && "ring-2 ring-yellow-500/50",
                                                            option.status === "rejected" && "opacity-50"
                                                        )}
                                                    >
                                                        <div className="aspect-square relative bg-muted">
                                                            {displayImage ? (
                                                                <Image
                                                                    src={displayImage}
                                                                    alt={option.optionText}
                                                                    fill
                                                                    className="object-cover"
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Users className="size-8 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            {/* Status Badge */}
                                                            {option.status !== "approved" && (
                                                                <div className="absolute top-2 left-2">
                                                                    {getStatusBadge(option.status)}
                                                                </div>
                                                            )}
                                                            {/* Public nomination indicator */}
                                                            {option.isPublicNomination && (
                                                                <div className="absolute top-2 right-2">
                                                                    <Badge variant="outline" className="bg-background/80 text-xs">
                                                                        <Globe className="size-3" />
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {canEdit && (
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                    {option.status === "pending" ? (
                                                                        <>
                                                                            <Button
                                                                                size="icon"
                                                                                variant="secondary"
                                                                                className="bg-green-500 hover:bg-green-600"
                                                                                onClick={() => handleApproveNomination(option.id)}
                                                                                disabled={isPending}
                                                                            >
                                                                                <CheckCircle2 className="size-4" />
                                                                            </Button>
                                                                            <Button
                                                                                size="icon"
                                                                                variant="destructive"
                                                                                onClick={() => handleRejectNomination(option.id)}
                                                                                disabled={isPending}
                                                                            >
                                                                                <XCircle className="size-4" />
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                size="icon"
                                                                                variant="secondary"
                                                                                onClick={() => openEditOption(option, category.id)}
                                                                            >
                                                                                <Pencil className="size-4" />
                                                                            </Button>
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                    <Button size="icon" variant="destructive">
                                                                                        <Trash2 className="size-4" />
                                                                                    </Button>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Delete Nominee?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            This will remove {option.optionText} from this category.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                        <AlertDialogAction
                                                                                            onClick={() => handleDeleteOption(option.id)}
                                                                                            className="bg-destructive text-destructive-foreground"
                                                                                        >
                                                                                            Delete
                                                                                        </AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <CardContent className="p-3">
                                                            <p className="font-medium text-sm truncate">
                                                                {option.optionText}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                {option.nomineeCode && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Hash className="size-3" />
                                                                        {option.nomineeCode}
                                                                    </span>
                                                                )}
                                                                <span>{Number(option.votesCount)} votes</span>
                                                            </div>
                                                            {option.email && (
                                                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                                                                    <Mail className="size-3" />
                                                                    {option.email}
                                                                </p>
                                                            )}
                                                            {option.isPublicNomination && option.nominatedByName && (
                                                                <p className="text-xs text-muted-foreground truncate mt-1">
                                                                    Nominated by: {option.nominatedByName}
                                                                </p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </AccordionContent>
                                    </SortableCategoryItem>
                                );
                            })}
                        </Accordion>
                    </SortableContext>
                </DndContext>
            )}

            {/* Option Sheet */}
            <Sheet open={optionDialogOpen} onOpenChange={(open) => {
                setOptionDialogOpen(open);
                if (!open) resetOptionForm();
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
                                    {optionForm.imageUrl ? (
                                        <Image
                                            src={optionForm.imageUrl}
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
                                    {optionForm.imageUrl && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setOptionForm(prev => ({ ...prev, imageUrl: "" }))}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Template Image Section - Only show if category has template */}
                        {currentCategory?.templateImage && (
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Layers className="size-4" />
                                    Template Image
                                </Label>
                                <div className="flex items-start gap-4">
                                    <div className="size-24 rounded-lg border bg-muted overflow-hidden relative shrink-0">
                                        {optionForm.finalImage ? (
                                            <Image
                                                src={optionForm.finalImage}
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
                                            {optionForm.imageUrl && (
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
                                        {optionForm.finalImage && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setOptionForm(prev => ({ ...prev, finalImage: "" }))}
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
                                value={optionForm.optionText}
                                onChange={(e) =>
                                    setOptionForm(prev => ({ ...prev, optionText: e.target.value }))
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
                                value={optionForm.nomineeCode}
                                onChange={(e) =>
                                    setOptionForm(prev => ({ ...prev, nomineeCode: e.target.value }))
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
                                value={optionForm.email}
                                onChange={(e) =>
                                    setOptionForm(prev => ({ ...prev, email: e.target.value }))
                                }
                                placeholder="nominee@email.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="option-description">Description</Label>
                            <Textarea
                                id="option-description"
                                value={optionForm.description}
                                onChange={(e) =>
                                    setOptionForm(prev => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Brief description..."
                                rows={3}
                            />
                        </div>

                        {/* Custom Fields */}
                        {currentCategory?.customFields && currentCategory.customFields.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <Label className="flex items-center gap-2">
                                        <FileText className="size-4" />
                                        Additional Information
                                    </Label>
                                    {currentCategory.customFields.map((field) => {
                                        const fieldValue = optionForm.fieldValues.find(f => f.fieldId === field.id);
                                        return (
                                            <div key={field.id} className="space-y-2">
                                                <Label htmlFor={`field-${field.id}`}>
                                                    {field.fieldLabel}
                                                    {field.isRequired && " *"}
                                                </Label>
                                                {field.fieldType === "textarea" ? (
                                                    <Textarea
                                                        id={`field-${field.id}`}
                                                        value={fieldValue?.value ?? ""}
                                                        onChange={(e) => {
                                                            setOptionForm(prev => ({
                                                                ...prev,
                                                                fieldValues: prev.fieldValues.map(f =>
                                                                    f.fieldId === field.id
                                                                        ? { ...f, value: e.target.value }
                                                                        : f
                                                                ),
                                                            }));
                                                        }}
                                                        placeholder={field.placeholder ?? undefined}
                                                        rows={3}
                                                    />
                                                ) : field.fieldType === "select" && field.options ? (
                                                    <Select
                                                        value={fieldValue?.value ?? ""}
                                                        onValueChange={(value) => {
                                                            setOptionForm(prev => ({
                                                                ...prev,
                                                                fieldValues: prev.fieldValues.map(f =>
                                                                    f.fieldId === field.id
                                                                        ? { ...f, value }
                                                                        : f
                                                                ),
                                                            }));
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={field.placeholder ?? "Select..."} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {field.options.split(",").map((opt) => (
                                                                <SelectItem key={opt.trim()} value={opt.trim()}>
                                                                    {opt.trim()}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : field.fieldType === "file" ? (
                                                    <div className="space-y-2">
                                                        <Input
                                                            id={`field-${field.id}`}
                                                            type="file"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                // For now, store the file name - actual upload would be handled separately
                                                                setOptionForm(prev => ({
                                                                    ...prev,
                                                                    fieldValues: prev.fieldValues.map(f =>
                                                                        f.fieldId === field.id
                                                                            ? { ...f, value: file.name }
                                                                            : f
                                                                    ),
                                                                }));
                                                                toast.info("File selected: " + file.name);
                                                            }}
                                                            className="cursor-pointer"
                                                        />
                                                        {fieldValue?.value && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Current: {fieldValue.value}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Input
                                                        id={`field-${field.id}`}
                                                        type={getInputType(field.fieldType)}
                                                        value={fieldValue?.value ?? ""}
                                                        onChange={(e) => {
                                                            setOptionForm(prev => ({
                                                                ...prev,
                                                                fieldValues: prev.fieldValues.map(f =>
                                                                    f.fieldId === field.id
                                                                        ? { ...f, value: e.target.value }
                                                                        : f
                                                                ),
                                                            }));
                                                        }}
                                                        placeholder={field.placeholder ?? undefined}
                                                    />
                                                )}
                                            </div>
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
                                setOptionDialogOpen(false);
                                resetOptionForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveOption} disabled={isPending || isUploadingImage}>
                            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                            {editingOption ? "Save Changes" : "Add Nominee"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Custom Fields Sheet */}
            <Sheet open={fieldsDialogOpen} onOpenChange={(open) => {
                setFieldsDialogOpen(open);
                if (!open) {
                    resetFieldForm();
                    setFieldsCategory(null);
                }
            }}>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            Custom Fields for {fieldsCategory?.name}
                        </SheetTitle>
                        <SheetDescription>
                            Define additional fields that nominees can fill out
                        </SheetDescription>
                    </SheetHeader>
                    <SheetBody className="space-y-4">
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
                                                            options: field.options ?? "",
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
                    <SheetFooter>
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

            {/* Template Editor Dialog */}
            {currentCategory?.templateImage && uploadedPhotoForTemplate && (
                <TemplateEditor
                    open={templateEditorOpen}
                    onOpenChange={(open) => {
                        setTemplateEditorOpen(open);
                        if (!open) {
                            // Revoke object URL if it was a blob URL
                            if (uploadedPhotoForTemplate.startsWith("blob:")) {
                                URL.revokeObjectURL(uploadedPhotoForTemplate);
                            }
                            setUploadedPhotoForTemplate(null);
                        }
                    }}
                    templateImage={currentCategory.templateImage}
                    photoImage={uploadedPhotoForTemplate}
                    onSave={handleTemplateEditorSave}
                    isLoading={isUploadingImage}
                />
            )}
        </div>
    );
}
