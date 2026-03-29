"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Vote } from "lucide-react";
import { toast } from "sonner";
import { 
    approveNominationAction, 
    rejectNominationAction, 
    deleteOption 
} from "@/lib/actions/voting";
import type {
    CustomField,
    VotingCategory,
    VotingOption,
} from "@/lib/types/voting";
import { CategorySheet } from "./CategorySheet";
import { OptionSheet } from "./OptionSheet";
import { CustomFieldsSheet } from "./CustomFieldsSheet";
import { CategoryList } from "./CategoryList";
import { NominationRequestsSheet } from "./NominationRequestsSheet";
import {
    addCategory,
    addFieldToCategory,
    addOptionToCategory,
    removeFieldFromCategory,
    replaceCategory,
    replaceFieldInCategory,
    replaceOptionInCategories,
    updateOptionStatusInCategories,
} from "./state-updaters";

interface VotingManagerProps {
    readonly eventId: string;
    readonly categories: VotingCategory[];
    readonly canEdit: boolean;
    readonly votingMode?: string | null;
}

export function VotingManager({ eventId, categories: initialCategories, canEdit, votingMode }: VotingManagerProps) {
    const [categories, setCategories] = useState(initialCategories);
    const [isPending, startTransition] = useTransition();
    const [requestsSheetOpen, setRequestsSheetOpen] = useState(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<VotingCategory | null>(null);
    const [optionDialogOpen, setOptionDialogOpen] = useState(false);
    const [editingOption, setEditingOption] = useState<VotingOption | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false);
    const [fieldsCategoryId, setFieldsCategoryId] = useState<string | null>(null);
    const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(categories[0]?.id);

    const selectedCategory = selectedCategoryId
        ? categories.find(category => category.id === selectedCategoryId) ?? null
        : null;
    const fieldsCategory = fieldsCategoryId
        ? categories.find(category => category.id === fieldsCategoryId) ?? null
        : null;

    function openCreateCategory() {
        setEditingCategory(null);
        setCategoryDialogOpen(true);
    }

    function openEditCategory(category: VotingCategory) {
        setEditingCategory(category);
        setCategoryDialogOpen(true);
    }

    function openAddOption(categoryId: string) {
        setSelectedCategoryId(categoryId);
        setEditingOption(null);
        setOptionDialogOpen(true);
    }

    function openEditOption(option: VotingOption, categoryId: string) {
        setSelectedCategoryId(categoryId);
        setEditingOption(option);
        setOptionDialogOpen(true);
    }

    function openFieldsDialog(category: VotingCategory) {
        setFieldsCategoryId(category.id);
        setFieldsDialogOpen(true);
    }

    function handleCategoryCreated(category: VotingCategory) {
        setCategories(prev => addCategory(prev, category));
    }

    function handleCategoryUpdated(updatedCategory: VotingCategory) {
        setCategories(prev => replaceCategory(prev, updatedCategory));
        setEditingCategory(null);
    }

    function handleOptionCreated(categoryId: string, option: VotingOption) {
        setCategories(prev => addOptionToCategory(prev, categoryId, option));
        setEditingOption(null);
    }

    function handleOptionUpdated(updatedOption: VotingOption) {
        setCategories(prev => replaceOptionInCategories(prev, updatedOption));
        setEditingOption(null);
    }

    function handleFieldCreated(categoryId: string, field: CustomField) {
        setCategories(prev => addFieldToCategory(prev, categoryId, field));
    }

    function handleFieldUpdated(categoryId: string, updatedField: CustomField) {
        setCategories(prev => replaceFieldInCategory(prev, categoryId, updatedField));
    }

    function handleFieldDeleted(categoryId: string, fieldId: string) {
        setCategories(prev => removeFieldFromCategory(prev, categoryId, fieldId));
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

    function handleDeleteOption(optionId: string, code?: string) {
        startTransition(async () => {
            const result = await deleteOption(optionId, code);
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

    return (
        <div className="space-y-4">
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
                    <div className="flex items-center gap-2">
                        {(() => {
                            const pendingCount = categories.reduce((sum, cat) =>
                                sum + cat.votingOptions.filter(o => o.status === "pending").length, 0);


                            return (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="relative mr-2"
                                    onClick={() => setRequestsSheetOpen(true)}
                                >

                                 Public Requests
                                    {pendingCount > 0 &&
                                        <>
                                            <span className="absolute -top-1 -right-1 flex size-3">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                                                <span className="relative inline-flex size-3 rounded-full bg-destructive"></span>
                                            </span>
                                            <Badge variant="secondary" className="ml-2 bg-destructive/10 text-destructive hover:bg-destructive/20">
                                                {pendingCount}
                                            </Badge>
                                        </>}
                                </Button>
                            );

                            return null;
                        })()}
                        <CategorySheet
                            eventId={eventId}
                            open={categoryDialogOpen}
                            onOpenChange={setCategoryDialogOpen}
                            editingCategory={editingCategory}
                            votingMode={votingMode}
                            nextOrderIndex={categories.length}
                            onCategoryCreated={handleCategoryCreated}
                            onCategoryUpdated={handleCategoryUpdated}
                            trigger={
                                <Button variant="tertiary" size="sm" onClick={() => setEditingCategory(null)}>
                                    <Plus className="size-4 mr-2" />
                                    Add Category
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>

            <CategoryList
                eventId={eventId}
                categories={categories}
                setCategories={setCategories}
                activeCategoryId={activeCategoryId}
                setActiveCategoryId={setActiveCategoryId}
                canEdit={canEdit}
                onEditCategory={openEditCategory}
                onAddOption={openAddOption}
                onOpenFields={openFieldsDialog}
                onEditOption={openEditOption}
                onDeleteOption={handleDeleteOption}
                onAddFirst={openCreateCategory}
            />

            <OptionSheet
                eventId={eventId}
                open={optionDialogOpen}
                onOpenChange={(open) => {
                    setOptionDialogOpen(open);
                    if (!open) {
                        setEditingOption(null);
                        setSelectedCategoryId(null);
                    }
                }}
                category={selectedCategory}
                editingOption={editingOption}
                onOptionCreated={handleOptionCreated}
                onOptionUpdated={handleOptionUpdated}
            />

            <CustomFieldsSheet
                open={fieldsDialogOpen}
                onOpenChange={setFieldsDialogOpen}
                category={fieldsCategory}
                onClose={() => {
                    setFieldsDialogOpen(false);
                    setFieldsCategoryId(null);
                }}
                onFieldCreated={handleFieldCreated}
                onFieldUpdated={handleFieldUpdated}
                onFieldDeleted={handleFieldDeleted}
            />

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
