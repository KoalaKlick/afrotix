"use client";

import { useState, useTransition } from "react";
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
    SheetFooter
} from "@/components/ui/sheet";
import { 
    Loader2, 
    CheckCircle2, 
    Copy, 
    Send, 
    Sparkles, 
    User, 
    Mail, 
    Phone,
    ArrowRight,
    ClipboardCheck
} from "lucide-react";
import { publicRegisterAction } from "@/lib/actions/event-member";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface RegistrationField {
    id: string;
    label: string;
    type: string;
    placeholder?: string | null;
    options: string[];
    isRequired: boolean;
}

interface PublicRegistrationFormProps {
    eventId: string;
    eventName: string;
    registrationFields?: RegistrationField[];
    className?: string;
}

export function PublicRegistrationForm({ 
    eventId, 
    eventName, 
    registrationFields = [],
    className 
}: PublicRegistrationFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isSuccess, setIsSuccess] = useState(false);
    const [regData, setRegData] = useState<{ name: string; uniqueCode: string } | null>(null);

    const [formData, setFormData] = useState<Record<string, any>>({
        name: "",
        email: "",
        phone: "",
    });

    const [responses, setResponses] = useState<Record<string, any>>({});

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!formData.name || !formData.email) {
            toast.error("Name and email are required");
            return;
        }

        // Validate required custom fields
        for (const field of registrationFields) {
            if (field.isRequired && !responses[field.id]) {
                toast.error(`${field.label} is required`);
                return;
            }
        }

        startTransition(async () => {
            const result = await publicRegisterAction({
                eventId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                responses: responses
            });

            if (result.success && result.data) {
                setRegData(result.data);
                setIsSuccess(true);
                toast.success("Successfully registered!");
            } else {
                toast.error(result.error || "Failed to register");
            }
        });
    }

    const copyCode = () => {
        if (regData?.uniqueCode) {
            navigator.clipboard.writeText(regData.uniqueCode);
            toast.success("Code copied to clipboard");
        }
    };

    const renderField = (field: RegistrationField) => {
        switch (field.type) {
            case "select":
                return (
                    <Select 
                        onValueChange={(val: string) => setResponses(prev => ({ ...prev, [field.id]: val }))}
                        required={field.isRequired}
                    >
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder={field.placeholder || "Select an option"} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );      
            case "checkbox":
                return (
                    <div className="flex items-center space-x-2 py-2">
                        <Checkbox 
                            id={field.id} 
                            onCheckedChange={(val: boolean | "indeterminate") => setResponses(prev => ({ ...prev, [field.id]: !!val }))}
                        />
                        <label 
                            htmlFor={field.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {field.label} {field.isRequired && <span className="text-destructive">*</span>}
                        </label>
                    </div>
                );
            case "number":
                return (
                    <Input 
                        type="number"
                        placeholder={field.placeholder || ""} 
                        onChange={(e) => setResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="rounded-xl"
                        required={field.isRequired}
                    />
                );
            default:
                return (
                    <Input 
                        placeholder={field.placeholder || ""} 
                        onChange={(e) => setResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="rounded-xl"
                        required={field.isRequired}
                    />
                );
        }
    };

    return (
        <div className={cn("", className)}>
            <Sheet open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    // Reset success state when closing if needed
                    // setIsSuccess(false);
                }
            }}>
                <SheetTrigger className="bg-green-500" asChild>
                    <Button 
                    >
                        <span className="flex items-center gap-2">
                            Register for Entry
                            <ArrowRight className="size-3.5" />
                        </span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full border-l-0 sm:border-l">
                    <div className="h-2 bg-brand-secondary w-full" />
                    
                    {isSuccess && regData ? (
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 flex flex-col justify-center">
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                                    <CheckCircle2 className="size-10 text-brand-primary" />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Registration<br/>Complete!</h2>
                                <p className="text-muted-foreground text-sm">
                                    You're all set for <strong>{eventName}</strong>. 
                                    Your unique access code has been generated.
                                </p>
                            </div>

                            <div className="bg-brand-primary/5 border-2 border-dashed border-brand-primary/30 p-10 rounded-3xl text-center relative group">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Your Official Passcode</p>
                                <p className="text-5xl font-black tracking-tighter text-brand-primary font-mono select-all">
                                    {regData.uniqueCode}
                                </p>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="mt-6 gap-2 rounded-full font-bold uppercase tracking-wider text-[10px]"
                                    onClick={copyCode}
                                >
                                    <Copy className="size-3" />
                                    Copy Code
                                </Button>
                            </div>

                            <div className="space-y-6 pt-4">
                                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-2xl border">
                                    <Mail className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        We've sent this code to <strong>{formData.email}</strong>. 
                                        Please present it at the venue for check-in.
                                    </p>
                                </div>

                                <Button 
                                    variant="outline" 
                                    className="w-full h-12 rounded-xl font-bold uppercase tracking-widest"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Close Pass
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <SheetHeader className="p-6 text-left border-b bg-muted/20">
                                <div className="flex items-center gap-2 text-brand-secondary mb-1">
                                    <Sparkles className="size-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Attendance System</span>
                                </div>
                                <SheetTitle className="text-2xl font-black uppercase tracking-tight">Register for Access</SheetTitle>
                                <SheetDescription className="text-xs">
                                    Provide your details below to receive a unique entry passcode.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="reg-form" onSubmit={handleSubmit} className="space-y-6">
                                    {/* Core Fields */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                                <User className="size-3" /> Full Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input 
                                                id="name" 
                                                placeholder="John Doe" 
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                                <Mail className="size-3" /> Email Address <span className="text-destructive">*</span>
                                            </Label>
                                            <Input 
                                                id="email" 
                                                type="email"
                                                placeholder="email@example.com" 
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                                <Phone className="size-3" /> Phone Number (Optional)
                                            </Label>
                                            <Input 
                                                id="phone" 
                                                placeholder="+233..." 
                                                value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* Dynamic Fields */}
                                    {registrationFields.length > 0 && (
                                        <div className="pt-4 space-y-6 border-t border-dashed">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Additional Information</h3>
                                            <div className="space-y-4">
                                                {registrationFields.map(field => (
                                                    <div key={field.id} className="space-y-2">
                                                        {field.type !== "checkbox" && (
                                                            <Label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                                                <ClipboardCheck className="size-3" /> 
                                                                {field.label} {field.isRequired && <span className="text-destructive">*</span>}
                                                            </Label>
                                                        )}
                                                        {renderField(field)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>

                            <SheetFooter className="p-6 border-t bg-muted/20">
                                <Button 
                                    form="reg-form"
                                    type="submit" 
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Register & Get Access Code"
                                    )}
                                </Button>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
