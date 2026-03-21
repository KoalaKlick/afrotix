"use client";

import { useTransition, type Dispatch, type SetStateAction } from "react";
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
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
} from "@/components/ui/accordion";
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
    Plus,
    Trash2,
    Pencil,
    Users,
    Vote,
    Globe,
    Settings,
    Loader2,
} from "lucide-react";
import type { VotingCategory, VotingOption } from "@/lib/types/voting";
import { NomineeCard } from "../NomineeCard";
import { SortableCategoryItem } from "./SortableCategoryItem";
import {
    approveNominationAction,
    deleteCategory,
    deleteOption,
    rejectNominationAction,
    reorderCategories,
} from "@/lib/actions/voting";
import { toast } from "sonner";
import {
    removeCategory,
    removeOptionFromCategories,
    updateOptionStatusInCategories,
} from "./state-updaters";

interface CategoryListProps {
    readonly eventId: string;
    readonly categories: VotingCategory[];
    readonly setCategories: Dispatch<SetStateAction<VotingCategory[]>>;
    readonly canEdit: boolean;
    readonly onEditCategory: (category: VotingCategory) => void;
    readonly onAddOption: (categoryId: string) => void;
    readonly onOpenFields: (category: VotingCategory) => void;
    readonly onEditOption: (option: VotingOption, categoryId: string) => void;
    readonly onAddFirst: () => void;
}

export function CategoryList({
    eventId,
    categories,
    setCategories,
    canEdit,
    onEditCategory,
    onAddOption,
    onOpenFields,
    onEditOption,
    onAddFirst,
}: CategoryListProps) {
    const [isPending, startTransition] = useTransition();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex((item) => item.id === active.id);
            const newIndex = categories.findIndex((item) => item.id === over.id);
            const nextCategories = arrayMove(categories, oldIndex, newIndex);

            setCategories(nextCategories);
            startTransition(async () => {
                const result = await reorderCategories(eventId, nextCategories.map((category) => category.id));
                if (!result.success) {
                    toast.error("Failed to save category order");
                    setCategories(categories);
                }
            });
        }
    }

    function handleDeleteCategory(categoryId: string) {
        startTransition(async () => {
            const result = await deleteCategory(categoryId);
            if (result.success) {
                setCategories(prev => removeCategory(prev, categoryId));
                toast.success("Category deleted");
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleDeleteOption(optionId: string) {
        startTransition(async () => {
            const result = await deleteOption(optionId);
            if (result.success) {
                setCategories(prev => removeOptionFromCategories(prev, optionId));
                toast.success("Nominee deleted");
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleApproveNomination(optionId: string) {
        startTransition(async () => {
            const result = await approveNominationAction(optionId);
            if (result.success) {
                setCategories(prev => updateOptionStatusInCategories(prev, optionId, "approved"));
                toast.success("Nomination approved");
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleRejectNomination(optionId: string) {
        startTransition(async () => {
            const result = await rejectNominationAction(optionId);
            if (result.success) {
                setCategories(prev => updateOptionStatusInCategories(prev, optionId, "rejected"));
                toast.success("Nomination rejected");
            } else {
                toast.error(result.error);
            }
        });
    }

    if (categories.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Vote className="size-12 text-muted-foreground mb-4" />
                    <h4 className="font-medium mb-1">No categories yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Add voting categories to organize your nominees
                    </p>
                    {canEdit && (
                        <Button onClick={onAddFirst}>
                            <Plus className="size-4 mr-2" />
                            Add First Category
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={categories.map(c => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="space-y-2 ">
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
                                <AccordionContent className="px-4 pb-4 ">
                                    {category.description && (
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {category.description}
                                        </p>
                                    )}

                                    {/* Category Actions */}
                                    {canEdit && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => onEditCategory(category)}
                                            >
                                                <Pencil className="size-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="tertiary"
                                                size="sm"
                                                onClick={() => onAddOption(category.id)}
                                            >
                                                <Plus className="size-4 mr-2" />
                                                Add Nominee
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => onOpenFields(category)}
                                            >
                                                <Settings className="size-4 mr-2" />
                                                Custom Fields
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="text-destructive" disabled={isPending}>
                                                        {isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Trash2 className="size-4 mr-2" />}
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
                                                const displayImage = option.imageUrl;
                                                return (
                                                    <NomineeCard
                                                        key={option.id}
                                                        option={option}
                                                        displayImage={displayImage}
                                                        canEdit={canEdit}
                                                        isPending={isPending}
                                                        onEdit={() => onEditOption(option, category.id)}
                                                        onDelete={() => handleDeleteOption(option.id)}
                                                        onApprove={() => handleApproveNomination(option.id)}
                                                        onReject={() => handleRejectNomination(option.id)}
                                                    />
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
    );
}
