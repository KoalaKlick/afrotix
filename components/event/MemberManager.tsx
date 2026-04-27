"use client";

import { useState, useTransition } from "react";
import {
    UserPlus,
    Upload,
    Send,
    MoreHorizontal,
    Mail,
    Phone,
    Trash2,
    Search,
    Pencil,
    Info,
    ChevronRight,
    Sparkles,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import {
    bulkAddEventMembersAction,
    sendSingleCodeAction,
    deleteEventMemberAction
} from "@/lib/actions/event-member";
import { cn } from "@/lib/utils";
import { RegistrationFieldManager } from "./RegistrationFieldManager";
import { MemberSheet } from "./MemberSheet";

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

interface MemberManagerProps {
    readonly eventId: string;
    readonly initialMembers: any[];
    readonly registrationFields: any[];
    readonly canEdit: boolean;
}

export function MemberManager({ eventId, initialMembers, registrationFields, canEdit }: MemberManagerProps) {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    // Sheets state
    const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false);
    const [isBulkSheetOpen, setIsBulkSheetOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [bulkData, setBulkData] = useState("");

    const handleBulkAdd = async () => {
        if (!bulkData) {
            toast.error("Please enter member data");
            return;
        }

        const lines = bulkData.split("\n").filter(l => l.trim());
        const membersToadd = lines.map(line => {
            const parts = line.split(",").map(p => p.trim());
            return {
                name: parts[0],
                email: parts[1] || undefined,
                phone: parts[2] || undefined,
            };
        });

        startTransition(async () => {
            const result = await bulkAddEventMembersAction(eventId, membersToadd);
            if (result.success) {
                toast.success(`Successfully imported members`);
                setIsBulkSheetOpen(false);
                setBulkData("");
                // Real implementation would re-fetch or update list
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleDeleteMember = async (id: string) => {
        startTransition(async () => {
            const result = await deleteEventMemberAction(id, eventId);
            if (result.success) {
                toast.success("Member removed");
                setMembers(members.filter(m => m.id !== id));
            } else {
                toast.error(result.error);
            }
        });
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search members..."
                        className="pl-10 h-11 rounded-xl bg-muted/30 border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {canEdit && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <RegistrationFieldManager 
                            eventId={eventId} 
                            fields={registrationFields} 
                            canEdit={canEdit} 
                        />

                        <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                                setEditingMember(null);
                                setIsMemberSheetOpen(true);
                            }}
                        >
                            <UserPlus className="size-4" />
                            Add Member
                        </Button>

                        <Sheet open={isBulkSheetOpen} onOpenChange={setIsBulkSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Upload className="size-4" />
                                    Bulk Import
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" variant="afro" className="sm:max-w-md w-full p-0 flex flex-col h-full">
                                <SheetHeader className="p-6 border-b">
                                    <SheetTitle className="text-2xl font-black uppercase tracking-tight">Bulk Import</SheetTitle>
                                    <SheetDescription>Paste a list: Name, Email, Phone (one per line).</SheetDescription>
                                </SheetHeader>
                                <SheetBody className="p-6 flex-1">
                                    <Textarea
                                        placeholder="Kofi Mensah, kofi@gmail.com, +233123456789&#10;Ama Serwaa, ama@gmail.com, +233987654321"
                                        className="h-full min-h-[300px] resize-none rounded-2xl bg-muted/30 border-dashed"
                                        value={bulkData}
                                        onChange={(e) => setBulkData(e.target.value)}
                                    />
                                </SheetBody>
                                <SheetFooter className="p-6 border-t bg-muted/20">
                                    <Button
                                        className="w-full h-14 bg-brand-primary font-black uppercase tracking-widest rounded-xl"
                                        onClick={handleBulkAdd}
                                        disabled={isPending}
                                    >
                                        {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : "Import Members"}
                                    </Button>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                )}
            </div>

            {/* Reusable Member Sheet for Add/Edit */}
            <MemberSheet
                eventId={eventId}
                open={isMemberSheetOpen}
                onOpenChange={setIsMemberSheetOpen}
                editingMember={editingMember}
                registrationFields={registrationFields}
                onMemberSaved={(savedMember) => {
                    if (editingMember) {
                        setMembers(members.map(m => m.id === savedMember.id ? savedMember : m));
                    } else {
                        setMembers([savedMember, ...members]);
                    }
                }}
            />

            <div className="bg-card border rounded-md overflow-hidden ">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-12 text-center text-[10px] font-bold uppercase tracking-[0.2em]">#</TableHead>
                            <TableHead className="font-bold uppercase tracking-widest text-[10px]">Participant</TableHead>
                            <TableHead className="font-bold uppercase tracking-widest text-[10px]">Access Code</TableHead>
                            <TableHead className="font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                            <TableHead className="font-bold uppercase tracking-widest text-[10px]">Registered On</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <Users className="size-8 opacity-20" />
                                        <p>No members found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMembers.map((member, index) => (
                                <TableRow key={member.id} className="hover:bg-muted/30 transition-colors group">
                                    <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{member.name}</span>
                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                                                {member.email && <span className="flex items-center gap-1"><Mail className="size-3" /> {member.email}</span>}
                                                {member.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {member.phone}</span>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs py-1 px-3 bg-muted/50 rounded-lg">
                                            {member.uniqueCode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge variant={member.status} />
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(member.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest">Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingMember(member);
                                                    setIsMemberSheetOpen(true);
                                                }}>
                                                    <Pencil className="size-4 mr-2" />
                                                    Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => startTransition(async () => {
                                                        const result = await sendSingleCodeAction(member.id);
                                                        if (result.success) toast.success("Code sent successfully");
                                                        else toast.error(result.error);
                                                    })}
                                                >
                                                    <Mail className="size-4 mr-2" />
                                                    Send Access Code
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onSelect={(e) => e.preventDefault()}
                                                        >
                                                            <Trash2 className="size-4 mr-2" />
                                                            Remove Member
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-2xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Remove Participant?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will revoke their access code and delete all registration data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                                                onClick={() => handleDeleteMember(member.id)}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="bg-muted/30 border p-6 rounded-md flex items-start gap-4">
                <div className="p-3 bg-brand-primary/10 rounded-md text-brand-primary">
                    <Info className="size-6" />
                </div>
                <div className="space-y-1">
                    <p className="font-black uppercase tracking-tight text-sm text-muted-foreground">About Participants</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Add members manually, import them in bulk, or define custom registration fields.
                        Each member receives a unique code for verification.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Helper icons
function Users(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
