"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    getInputType,
    type CustomField,
} from "@/lib/types/voting";

interface OptionCustomFieldInputProps {
    readonly field: CustomField;
    readonly value: string;
    readonly onChange: (value: string) => void;
}

export function OptionCustomFieldInput({ field, value, onChange }: OptionCustomFieldInputProps) {
    const selectOptions = field.options ?? [];

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        onChange(file.name);
        toast.info("File selected: " + file.name);
    }

    let input = (
        <Input
            id={`field-${field.id}`}
            type={getInputType(field.fieldType)}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? undefined}
        />
    );

    if (field.fieldType === "textarea") {
        input = (
            <Textarea
                id={`field-${field.id}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder ?? undefined}
                rows={3}
            />
        );
    } else if (field.fieldType === "select" && selectOptions.length > 0) {
        input = (
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder={field.placeholder ?? "Select..."} />
                </SelectTrigger>
                <SelectContent>
                    {selectOptions.map((option) => {
                        const trimmedOption = option.trim();
                        return (
                            <SelectItem key={trimmedOption} value={trimmedOption}>
                                {trimmedOption}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        );
    } else if (field.fieldType === "file") {
        input = (
            <div className="space-y-2">
                <Input
                    id={`field-${field.id}`}
                    type="file"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                />
                {value && (
                    <p className="text-xs text-muted-foreground">
                        Current: {value}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={`field-${field.id}`}>
                {field.fieldLabel}
                {field.isRequired && " *"}
            </Label>
            {input}
        </div>
    );
}
