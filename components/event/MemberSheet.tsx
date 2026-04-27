"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetBody,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
    Loader2,
    Mail,
    Phone,
    User,
    ClipboardCheck,
    Hash
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { addEventMemberAction, updateEventMemberAction } from "@/lib/actions/event-member";

interface Member {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    uniqueCode: string;
    status: string;
    responses: any;
    createdAt: Date;
}

interface MemberSheetProps {
    readonly eventId: string;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly editingMember: Member | null;
    readonly registrationFields: any[];
    readonly onMemberSaved: (member: Member) => void;
}

export function MemberSheet({
    eventId,
    open,
    onOpenChange,
    editingMember,
    registrationFields,
    onMemberSaved,
}: MemberSheetProps) {
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        responses: {} as Record<string, any>
    });

    const resetForm = useCallback(() => {
        setForm({
            name: "",
            email: "",
            phone: "",
            responses: {}
        });
    }, []);

    useEffect(() => {
        if (open && editingMember) {
            setForm({
                name: editingMember.name,
                email: editingMember.email ?? "",
                phone: editingMember.phone ?? "",
                responses: (editingMember.responses as Record<string, any>) || {}
            });
        } else if (open) {
            resetForm();
        }
    }, [open, editingMember, resetForm]);

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error("Name is required");
            return;
        }

        startTransition(async () => {
            const payload = {
                name: form.name,
                email: form.email || undefined,
                phone: form.phone || undefined,
                responses: form.responses
            };

            const result = editingMember 
                ? await updateEventMemberAction(editingMember.id, eventId, payload)
                : await addEventMemberAction({ ...payload, eventId });

            if (result.success) {
                toast.success(editingMember ? "Member updated" : "Member added");
                onMemberSaved(result.data as Member);
                onOpenChange(false);
                resetForm();
            } else {
                toast.error(result.error || "Failed to save member");
            }
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" variant="afro" className="w-full sm:max-w-xl flex flex-col h-full">
                <SheetHeader className="shrink-0">
                    <SheetTitle>
                        {editingMember ? "Edit Participant" : "Add Participant"}
                    </SheetTitle>
                    <SheetDescription>
                        {editingMember ? "Update member details and custom responses" : "Manually add a new member to this event"}
                    </SheetDescription>
                </SheetHeader>
                
                <SheetBody className="space-y-6 flex-1 overflow-y-auto pr-2 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="member-name" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                <User className="size-3.5" /> Full Name *
                            </Label>
                            <Input
                                id="member-name"
                                value={form.name}
                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Kofi Mensah"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="member-email" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <Mail className="size-3.5" /> Email Address
                                </Label>
                                <Input
                                    id="member-email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="member-phone" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <Phone className="size-3.5" /> Phone Number
                                </Label>
                                <Input
                                    id="member-phone"
                                    value={form.phone}
                                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+233..."
                                />
                            </div>
                        </div>

                        {editingMember && (
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <Hash className="size-3.5" /> Unique Access Code
                                </Label>
                                <Input
                                    value={editingMember.uniqueCode}
                                    disabled
                                    className="h-12 rounded-xl bg-muted/50 font-mono"
                                />
                            </div>
                        )}
                    </div>

                    {registrationFields.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-primary">
                                    <ClipboardCheck className="size-4" />
                                    Custom Registration Data
                                </Label>
                                <div className="space-y-4">
                                    {registrationFields.map(field => (
                                        <div key={field.id} className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest">{field.label}</Label>
                                            {field.type === "select" ? (
                                                <Select 
                                                    value={form.responses[field.id] || ""} 
                                                    onValueChange={(val) => setForm(prev => ({ ...prev, responses: { ...prev.responses, [field.id]: val } }))}
                                                >
                                                    <SelectTrigger className="h-12 rounded-xl">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {field.options.map((opt: string) => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : field.type === "checkbox" ? (
                                                <div className="flex items-center space-x-2 py-1">
                                                    <Checkbox 
                                                        id={`field-${field.id}`}
                                                        checked={!!form.responses[field.id]}
                                                        onCheckedChange={(val: boolean | "indeterminate") => setForm(prev => ({ ...prev, responses: { ...prev.responses, [field.id]: !!val } }))}
                                                    />
                                                    <Label htmlFor={`field-${field.id}`} className="text-sm font-medium cursor-pointer">{field.label}</Label>
                                                </div>
                                            ) : (
                                                <Input 
                                                    placeholder={field.placeholder || ""}
                                                    value={form.responses[field.id] || ""}
                                                    onChange={(e) => setForm(prev => ({ ...prev, responses: { ...prev.responses, [field.id]: e.target.value } }))}
                                                    className=""
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </SheetBody>

                <SheetFooter className="shrink-0 pt-2 border-t mt-auto">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                        {editingMember ? "Save Changes" : "Add Participant"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
