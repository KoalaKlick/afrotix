import type {
    CustomField,
    VotingCategory,
    VotingOption,
    VotingOptionStatus,
} from "@/lib/types/voting";

export function addCategory(categories: VotingCategory[], category: VotingCategory) {
    return [...categories, category];
}

export function replaceCategory(categories: VotingCategory[], updatedCategory: VotingCategory) {
    return categories.map(category =>
        category.id === updatedCategory.id ? updatedCategory : category
    );
}

export function removeCategory(categories: VotingCategory[], categoryId: string) {
    return categories.filter(category => category.id !== categoryId);
}

export function addOptionToCategory(categories: VotingCategory[], categoryId: string, option: VotingOption) {
    return categories.map(category => {
        if (category.id !== categoryId) {
            return category;
        }

        return {
            ...category,
            votingOptions: [...category.votingOptions, option],
        };
    });
}

export function replaceOptionInCategories(categories: VotingCategory[], updatedOption: VotingOption) {
    return categories.map(category => ({
        ...category,
        votingOptions: category.votingOptions.map(option =>
            option.id === updatedOption.id ? updatedOption : option
        ),
    }));
}

export function removeOptionFromCategories(categories: VotingCategory[], optionId: string) {
    return categories.map(category => ({
        ...category,
        votingOptions: category.votingOptions.filter(option => option.id !== optionId),
    }));
}

export function updateOptionStatusInCategories(
    categories: VotingCategory[],
    optionId: string,
    status: VotingOptionStatus
) {
    return categories.map(category => ({
        ...category,
        votingOptions: category.votingOptions.map(option =>
            option.id === optionId ? { ...option, status } : option
        ),
    }));
}

export function addFieldToCategory(categories: VotingCategory[], categoryId: string, field: CustomField) {
    return categories.map(category => {
        if (category.id !== categoryId) {
            return category;
        }

        return {
            ...category,
            customFields: [...(category.customFields ?? []), field],
        };
    });
}

export function replaceFieldInCategory(categories: VotingCategory[], categoryId: string, updatedField: CustomField) {
    return categories.map(category => {
        if (category.id !== categoryId) {
            return category;
        }

        return {
            ...category,
            customFields: category.customFields?.map(field =>
                field.id === updatedField.id ? updatedField : field
            ),
        };
    });
}

export function removeFieldFromCategory(categories: VotingCategory[], categoryId: string, fieldId: string) {
    return categories.map(category => {
        if (category.id !== categoryId) {
            return category;
        }

        return {
            ...category,
            customFields: category.customFields?.filter(field => field.id !== fieldId),
        };
    });
}
