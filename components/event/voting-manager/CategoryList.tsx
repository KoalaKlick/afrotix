"use client";

import { useTransition, type Dispatch, type SetStateAction, useMemo } from "react";
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
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";

interface CategoryListProps {
    readonly eventId: string;
    readonly categories: VotingCategory[];
    readonly setCategories: Dispatch<SetStateAction<VotingCategory[]>>;
    readonly activeCategoryId: string | undefined;
    readonly setActiveCategoryId: (id: string | undefined) => void;
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
    activeCategoryId,
    setActiveCategoryId,
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

    function handleApproveNomination(optionId: string) {
        startTransition(async () => {
            const result = await approveNominationAction(optionId);
            if (result.success) {
                setCategories(prev =>
                    prev.map(c => ({
                        ...c,
                        votingOptions: c.votingOptions.map(o =>
                            o.id === optionId ? { ...o, status: "approved" as const } : o
                        ),
                    }))
                );
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
                setCategories(prev =>
                    prev.map(c => ({
                        ...c,
                        votingOptions: c.votingOptions.map(o =>
                            o.id === optionId ? { ...o, status: "rejected" as const } : o
                        ),
                    }))
                );
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
        <Tabs value={activeCategoryId} onValueChange={setActiveCategoryId} className="space-y-4">
            <div className={cn(
                "flex items-center gap-2 overflow-x-auto no-scrollbar pb-1",
            )}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={categories.map(c => c.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        <TabsList variant="afro" className={cn("w-full justify-start overflow-y overflow-x-auto")}>
                            {categories.map((category) => (
                                <SortableCategoryItem
                                    key={category.id}
                                    category={category}
                                    canEdit={canEdit}
                                />
                            ))}
                        </TabsList>
                    </SortableContext>
                </DndContext>
            </div>

            {categories.map((category) => {
                const pendingCount = category.votingOptions.filter(o => o.status === "pending").length;
                const approvedNominees = category.votingOptions.filter(o => o.status === "approved");
                
                return (
                    <TabsContent key={category.id} value={category.id} className="space-y-4 pt-2 mt-0">
                        {/* Category Info & Actions */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-lg font-semibold">{category.name}</h4>
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
                                {category.description && (
                                    <p className="text-sm text-muted-foreground max-w-2xl">
                                        {category.description}
                                    </p>
                                )}
                            </div>

                            {canEdit && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEditCategory(category)}
                                    >
                                        <Pencil className="size-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onOpenFields(category)}
                                    >
                                        <Settings className="size-4 mr-2" />
                                        Fields
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onAddOption(category.id)}
                                    >
                                        <Plus className="size-4 mr-2" />
                                        Add Nominee
                                    </Button>
                                    
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive h-8 px-2">
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will delete "{category.name}" and all its nominees.
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
                        </div>

                        {/* Nominees Grid */}
                        {category.votingOptions.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <Users className="size-12 text-muted-foreground mb-4 opacity-20" />
                                    <h4 className="font-medium mb-1 text-muted-foreground">No nominees yet</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Add candidates to this category to start voting
                                    </p>
                                    {canEdit && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => onAddOption(category.id)}
                                        >
                                            <Plus className="size-4 mr-2" />
                                            Add First Nominee
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid @md:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-4 @7xl:grid-cols-5 gap-4">
                                {category.votingOptions.map((option) => (
                                    <NomineeCard
                                        key={option.id}
                                        option={option}
                                        displayImage={option.imageUrl}
                                        canEdit={canEdit}
                                        isPending={isPending}
                                        onEdit={() => onEditOption(option, category.id)}
                                        onDelete={() => handleDeleteOption(option.id)}
                                        onApprove={() => handleApproveNomination(option.id)}
                                        onReject={() => handleRejectNomination(option.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                );
            })}
        </Tabs>
    );
}



