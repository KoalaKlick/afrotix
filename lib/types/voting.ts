/**
 * Voting Types & Interfaces
 * Shared types for voting components
 */

// Field type options for custom fields
export const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Long Text" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "url", label: "URL" },
    { value: "date", label: "Date" },
    { value: "file", label: "File/Attachment" },
    { value: "select", label: "Dropdown" },
] as const;

export type FieldType = (typeof FIELD_TYPES)[number]["value"];

const FIELD_TYPE_VALUES = new Set<FieldType>(FIELD_TYPES.map((field) => field.value));

export function normalizeFieldType(fieldType: string): FieldType {
    return FIELD_TYPE_VALUES.has(fieldType as FieldType)
        ? (fieldType as FieldType)
        : "text";
}

export interface CustomField {
    id: string;
    fieldName: string;
    fieldType: FieldType;
    fieldLabel: string;
    placeholder: string | null;
    isRequired: boolean;
    options: string[] | null;
    orderIdx: number;
}

export interface FieldValue {
    fieldId: string;
    value: string;
}

export type VotingOptionStatus = "pending" | "approved" | "rejected";

export interface VotingOption {
    id: string;
    optionText: string;
    nomineeCode: string | null;
    email: string | null;
    description: string | null;
    imageUrl: string | null;
    status: VotingOptionStatus;
    isPublicNomination: boolean;
    nominatedByName: string | null;
    votesCount: bigint;
    orderIdx: number;
    deletionCode: string | null;
    fieldValues?: FieldValue[];
}

export interface VotingCategory {
    id: string;
    name: string;
    description: string | null;
    templateImage?: string | null;
    templateConfig?: any | null;
    showFinalImage?: boolean;
    maxVotesPerUser: number;
    allowMultiple: boolean;
    allowPublicNomination: boolean;
    nominationDeadline: string | Date | null;
    nominationPrice: number;
    votePrice: number;
    requireApproval: boolean;
    orderIdx: number;
    votingOptions: VotingOption[];
    customFields?: CustomField[];
}

export type VotingCategoryWithOptions = VotingCategory;
// Form state types
export interface CategoryFormData {
    name: string;
    description: string;
    maxVotesPerUser: number;
    allowMultiple: boolean;
    allowPublicNomination: boolean;
    nominationDeadline: string;
    requireApproval: boolean;
    templateImage?: string | null;
    templateConfig?: any | null;
    nominationPrice: number;
    votePrice: number;
    showFinalImage?: boolean;
}

export interface OptionFormData {
    optionText: string;
    nomineeCode: string;
    email: string;
    description: string;
    imageUrl: string;
    fieldValues: { fieldId: string; value: string }[];
}

export interface FieldFormData {
    fieldName: string;
    fieldType: FieldType;
    fieldLabel: string;
    placeholder: string;
    isRequired: boolean;
    options: string;
}

// Default form values
export const defaultCategoryForm: CategoryFormData = {
    name: "",
    description: "",
    maxVotesPerUser: 1,
    allowMultiple: false,
    allowPublicNomination: false,
    nominationDeadline: "",
    requireApproval: true,
    templateImage: null,
    templateConfig: null,
    nominationPrice: 0,
    votePrice: 0,
    showFinalImage: true,
};

export const defaultOptionForm: OptionFormData = {
    optionText: "",
    nomineeCode: "",
    email: "",
    description: "",
    imageUrl: "",
    fieldValues: [],
};

export const defaultFieldForm: FieldFormData = {
    fieldName: "",
    fieldType: "text",
    fieldLabel: "",
    placeholder: "",
    isRequired: false,
    options: "",
};

// Utility functions
export function getInputType(fieldType: FieldType): string {
    switch (fieldType) {
        case "number":
            return "number";
        case "email":
            return "email";
        case "url":
            return "url";
        case "date":
            return "date";
        default:
            return "text";
    }
}

// Map VotingOptionStatus to StatusBadge variant
export function getStatusVariant(status: VotingOptionStatus): string {
    switch (status) {
        case "approved":
            return "approved";
        case "pending":
            return "pending";
        case "rejected":
            return "rejected";
    }
}
