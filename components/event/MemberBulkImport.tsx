"use client";

import { useState, useTransition, useRef } from "react";
import { 
    Upload, 
    Download, 
    FileSpreadsheet, 
    AlertCircle, 
    CheckCircle2, 
    Loader2,
    Trash2,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { bulkAddEventMembersAction } from "@/lib/actions/event-member";
import { cn } from "@/lib/utils";

interface RegistrationField {
    id: string;
    label: string;
    isRequired: boolean;
}

interface MemberBulkImportProps {
    eventId: string;
    registrationFields: RegistrationField[];
    onSuccess: () => void;
}

interface ParsedMember {
    name: string;
    email: string;
    phone: string;
    responses: Record<string, any>;
    isValid: boolean;
    errors: string[];
}

export function MemberBulkImport({ eventId, registrationFields, onSuccess }: MemberBulkImportProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [parsedData, setParsedData] = useState<ParsedMember[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = () => {
        const headers = ["Full Name", "Email", "Phone Number", ...registrationFields.map(f => f.label)];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + 
            "John Doe,john@example.com,+233123456789," + registrationFields.map(() => "").join(",");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `event_members_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            parseCSV(text);
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = "";
    };

    const parseCSV = (text: string) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
            toast.error("File is empty or missing headers");
            return;
        }

        // Improved regex for CSV splitting that handles quoted values
        const splitLine = (line: string) => {
            const result = [];
            let start = 0;
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') inQuotes = !inQuotes;
                if (line[i] === ',' && !inQuotes) {
                    result.push(line.substring(start, i).replace(/^"|"$/g, '').trim());
                    start = i + 1;
                }
            }
            result.push(line.substring(start).replace(/^"|"$/g, '').trim());
            return result;
        };

        const formatValue = (val: string) => {
            if (!val) return "";
            // If it's scientific notation (Excel default for long numbers like 2.33E+11)
            if (/^\d+\.?\d*E\+\d+$/i.test(val)) {
                try {
                    // Convert to full string representation
                    return BigInt(Math.round(Number(val))).toString();
                } catch {
                    return val;
                }
            }
            return val;
        };

        const headers = splitLine(lines[0]).map(h => h.toLowerCase());
        const rows = lines.slice(1);

        const newMembers: ParsedMember[] = rows.map(row => {
            const values = splitLine(row).map(v => formatValue(v));
            const member: ParsedMember = {
                name: "",
                email: "",
                phone: "",
                responses: {},
                isValid: true,
                errors: []
            };

            headers.forEach((header, index) => {
                const value = values[index] || "";
                
                if (header === "full name" || header === "name") {
                    member.name = value;
                } else if (header === "email") {
                    member.email = value;
                } else if (header === "phone number" || header === "phone") {
                    member.phone = value;
                } else {
                    // Try to match registration field by label
                    const field = registrationFields.find(f => f.label.toLowerCase() === header);
                    if (field) {
                        member.responses[field.id] = value;
                    }
                }
            });

            // Validation
            if (!member.name) {
                member.isValid = false;
                member.errors.push("Missing name");
            }
            
            // Check required registration fields
            registrationFields.forEach(field => {
                if (field.isRequired && !member.responses[field.id]) {
                    member.isValid = false;
                    member.errors.push(`Missing ${field.label}`);
                }
            });

            return member;
        });

        setParsedData(newMembers);
    };

    const handleImport = () => {
        const validMembers = parsedData.filter(m => m.isValid);
        if (validMembers.length === 0) {
            toast.error("No valid members to import");
            return;
        }

        startTransition(async () => {
            // Map to the format the action expects
            const membersToImport = validMembers.map(m => ({
                name: m.name,
                email: m.email || undefined,
                phone: m.phone || undefined,
                responses: m.responses
            }));

            const result = await bulkAddEventMembersAction(eventId, membersToImport as any);
            if (result.success) {
                toast.success(`Successfully imported ${validMembers.length} members`);
                setIsOpen(false);
                setParsedData([]);
                onSuccess();
            } else {
                toast.error(result.error || "Failed to import members");
            }
        });
    };

    const removeRow = (index: number) => {
        setParsedData(prev => prev.filter((_, i) => i !== index));
    };

    const validCount = parsedData.filter(m => m.isValid).length;
    const invalidCount = parsedData.length - validCount;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="size-4" />
                    Bulk Import
                </Button>
            </SheetTrigger>
            <SheetContent side="right" variant="afro" className="sm:max-w-2xl w-full p-0 flex flex-col h-full">
                <SheetHeader className="p-6 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <SheetTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                                <FileSpreadsheet className="size-6 text-brand-primary" />
                                Bulk Import
                            </SheetTitle>
                            <SheetDescription>Download the template, fill it out, and upload it back.</SheetDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                            <Download className="size-4" />
                            Template
                        </Button>
                    </div>
                </SheetHeader>

                <SheetBody className="flex-1 overflow-hidden flex flex-col p-0">
                    {parsedData.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                            <div className="p-6 bg-muted/30 rounded-full">
                                <Upload className="size-12 text-muted-foreground opacity-20" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg">Upload your file</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                    Upload a CSV file containing your member list. Use our template for best results.
                                </p>
                            </div>
                            <Button 
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Select CSV File
                            </Button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".csv"
                                onChange={handleFileUpload}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-4 bg-muted/20 border-b flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        {validCount} Ready
                                    </Badge>
                                    {invalidCount > 0 && (
                                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                            {invalidCount} Invalid
                                        </Badge>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setParsedData([])} className="text-muted-foreground">
                                    <X className="size-4 mr-1" /> Clear
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[150px]">Name</TableHead>
                                            <TableHead>Email/Phone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((member, i) => (
                                            <TableRow key={i} className={cn(!member.isValid && "bg-destructive/5")}>
                                                <TableCell className="font-medium">{member.name || <span className="text-destructive font-bold">MISSING</span>}</TableCell>
                                                <TableCell>
                                                    <div className="text-xs space-y-0.5">
                                                        <div className="text-muted-foreground">{member.email || "-"}</div>
                                                        <div className="text-[10px] opacity-70">{member.phone || "-"}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {member.isValid ? (
                                                        <CheckCircle2 className="size-4 text-green-500" />
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <AlertCircle className="size-4 text-destructive" />
                                                            {member.errors.map((err, ei) => (
                                                                <span key={ei} className="text-[10px] text-destructive leading-tight">{err}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeRow(i)}>
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </SheetBody>

                <SheetFooter className="px-6 py-3 border-t bg-muted/20 shrink-0">
                    <Button
                        onClick={handleImport}
                        disabled={isPending || parsedData.length === 0 || validCount === 0}
                    >
                        {isPending ? (
                            <><Loader2 className="mr-2 size-4 animate-spin" /> Importing...</>
                        ) : (
                            `Import ${validCount} Participants`
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
