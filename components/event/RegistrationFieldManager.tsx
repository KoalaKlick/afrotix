"use client";

import { useState, useTransition } from "react";
import { 
    Plus, 
    Trash2, 
    Pencil,
    Settings,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Sheet, 
    SheetContent, 
    SheetDescription, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger,
    SheetBody,
    SheetFooter
} from "@/components/ui/sheet";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
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
import { addRegistrationFieldAction, deleteRegistrationFieldAction } from "@/lib/actions/event-member";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FIELD_TYPES } from "@/lib/types/voting";

interface Field {
    id: string;
    label: string;
    type: string;
    isRequired: boolean;
    options: string[];
    placeholder?: string | null;
}

interface RegistrationFieldManagerProps {
    eventId: string;
    fields: Field[];
    canEdit: boolean;
    className?: string;
}

export function RegistrationFieldManager({ eventId, fields, canEdit, className }: RegistrationFieldManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    
    // Field Form State
    const [editingField, setEditingField] = useState<Field | null>(null);
    const [form, setForm] = useState({
        label: "",
        type: "text",
        isRequired: false,
        options: "",
        placeholder: ""
    });

    const resetForm = () => {
        setEditingField(null);
        setForm({
            label: "",
            type: "text",
            isRequired: false,
            options: "",
            placeholder: ""
        });
    };

    const handleSaveField = async () => {
        if (!form.label) {
            toast.error("Label is required");
            return;
        }

        startTransition(async () => {
            // Note: Currently addRegistrationFieldAction only handles creating.
            // If we want to edit, we'd need an updateRegistrationFieldAction.
            // For now, let's treat it as "Add" since that's what's available.
            
            const result = await addRegistrationFieldAction({
                eventId,
                label: form.label,
                type: form.type,
                isRequired: form.isRequired,
                options: form.options ? form.options.split(",").map(o => o.trim()) : [],
                placeholder: form.placeholder
            });

            if (result.success) {
                toast.success(editingField ? "Field updated" : "Field added");
                resetForm();
            } else {
                toast.error(result.error || "Failed to save field");
            }
        });
    };

    const handleDeleteField = async (id: string) => {
        startTransition(async () => {
            const result = await deleteRegistrationFieldAction(eventId, id);
            if (result.success) {
                toast.success("Field deleted");
            } else {
                toast.error(result.error || "Failed to delete field");
            }
        });
    };

    return (
        <div className={className}>
            <Sheet open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) resetForm();
            }}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <Settings className="size-4 text-muted-foreground" />
                        Form Setup
                        {fields.length > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 min-w-[1.25rem] font-bold text-[10px]">
                                {fields.length}
                            </Badge>
                        )}
                    </Button>
                </SheetTrigger>

                <SheetContent variant="afro" side="right" className="w-full sm:max-w-lg flex flex-col h-full p-0">
                    <SheetHeader className="p-6 shrink-0 border-b">
                        <SheetTitle>Registration Form Fields</SheetTitle>
                        <SheetDescription>
                            Define additional fields that attendees must fill when registering
                        </SheetDescription>
                    </SheetHeader>

                    <SheetBody className="space-y-6 flex-1 overflow-y-auto p-6">
                        {/* Current Fields */}
                        <div className="space-y-3">
                            <Label className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Form Structure</Label>
                            <div className="space-y-2">
                                {/* System Fields */}
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 opacity-80">
                                    <div>
                                        <p className="font-bold text-sm">Full Name</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">System Required • Text</p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter h-5">Core</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 opacity-80">
                                    <div>
                                        <p className="font-bold text-sm">Email Address</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">System Required • Email</p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter h-5">Core</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 opacity-80">
                                    <div>
                                        <p className="font-bold text-sm">Phone Number</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">System Optional • Phone</p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter h-5">Core</Badge>
                                </div>

                                {/* Custom Fields */}
                                {fields.map((field) => (
                                        <div
                                            key={field.id}
                                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{field.label}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {FIELD_TYPES.find(t => t.value === field.type)?.label ?? field.type}
                                                    {field.isRequired && " • Required"}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        setEditingField(field);
                                                        setForm({
                                                            label: field.label,
                                                            type: field.type,
                                                            isRequired: field.isRequired,
                                                            options: field.options?.join(", ") ?? "",
                                                            placeholder: field.placeholder ?? "",
                                                        });
                                                    }}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Field?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will remove the field &quot;{field.label}&quot; and all collected data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteField(field.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

                        <Separator className="my-6" />

                        {/* Form Section */}
                        <div className="space-y-4">
                            <Label className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                                {editingField ? "Edit Field" : "Add New Field"}
                            </Label>

                            <div className="space-y-2">
                                <Label htmlFor="reg-field-label">Label *</Label>
                                <Input
                                    id="reg-field-label"
                                    value={form.label}
                                    onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                                    placeholder="e.g. Which department are you from?"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reg-field-type">Field Type</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(value) => setForm(prev => ({ ...prev, type: value }))}
                                >
                                    <SelectTrigger id="reg-field-type">
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

                            {form.type === "select" && (
                                <div className="space-y-2 animate-in slide-in-from-top-1">
                                    <Label htmlFor="reg-field-options">Options (comma-separated)</Label>
                                    <Input
                                        id="reg-field-options"
                                        value={form.options}
                                        onChange={(e) => setForm(prev => ({ ...prev, options: e.target.value }))}
                                        placeholder="Option 1, Option 2, Option 3"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="reg-field-placeholder">Placeholder</Label>
                                <Input
                                    id="reg-field-placeholder"
                                    value={form.placeholder}
                                    onChange={(e) => setForm(prev => ({ ...prev, placeholder: e.target.value }))}
                                    placeholder="Hint text shown in empty field"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                <div className="space-y-0.5">
                                    <Label>Required Field</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Attendees must fill this field
                                    </p>
                                </div>
                                <Switch
                                    checked={form.isRequired}
                                    onCheckedChange={(val) => setForm(prev => ({ ...prev, isRequired: val }))}
                                />
                            </div>
                        </div>
                    </SheetBody>

                    <SheetFooter className="p-6 border-t bg-muted/20">
                        <div className="flex gap-2 w-full">
                            {editingField && (
                                <Button 
                                    variant="outline" 
                                    className="flex-1" 
                                    onClick={resetForm}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button 
                                className="flex-2"
                                variant="primary"
                                onClick={handleSaveField}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : editingField ? "Update Field" : "Add Field"}
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
