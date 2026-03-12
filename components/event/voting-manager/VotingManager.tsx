"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Vote } from "lucide-react";
import type {
    CustomField,
    VotingCategory,
    VotingOption,
} from "@/lib/types/voting";
import { CategorySheet } from "./CategorySheet";
import { OptionSheet } from "./OptionSheet";
import { CustomFieldsSheet } from "./CustomFieldsSheet";
import { CategoryList } from "./CategoryList";
import {
    addCategory,
    addFieldToCategory,
    addOptionToCategory,
    removeFieldFromCategory,
    replaceCategory,
    replaceFieldInCategory,
    replaceOptionInCategories,
} from "./state-updaters";

interface VotingManagerProps {
    readonly eventId: string;
    readonly categories: VotingCategory[];
    readonly canEdit: boolean;
}

export function VotingManager({ eventId, categories: initialCategories, canEdit }: VotingManagerProps) {
    const [categories, setCategories] = useState(initialCategories);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<VotingCategory | null>(null);
    const [optionDialogOpen, setOptionDialogOpen] = useState(false);
    const [editingOption, setEditingOption] = useState<VotingOption | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false);
    const [fieldsCategoryId, setFieldsCategoryId] = useState<string | null>(null);

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
                    <CategorySheet
                        eventId={eventId}
                        open={categoryDialogOpen}
                        onOpenChange={setCategoryDialogOpen}
                        editingCategory={editingCategory}
                        nextOrderIndex={categories.length}
                        onCategoryCreated={handleCategoryCreated}
                        onCategoryUpdated={handleCategoryUpdated}
                        trigger={
                            <Button size="sm" onClick={() => setEditingCategory(null)}>
                                <Plus className="size-4 mr-2" />
                                Add Category
                            </Button>
                        }
                    />
                )}
            </div>

            <CategoryList
                eventId={eventId}
                categories={categories}
                setCategories={setCategories}
                canEdit={canEdit}
                onEditCategory={openEditCategory}
                onAddOption={openAddOption}
                onOpenFields={openFieldsDialog}
                onEditOption={openEditOption}
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
        </div>
    );
}
