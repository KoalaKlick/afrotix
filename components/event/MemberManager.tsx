"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    Loader2,
    ClipboardCheck,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/shared/image/avatar";
import { DataTable, type Column } from "@/components/shared/DataTable";
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
    sendSingleCodeAction,
    sendCodesAction,
    deleteEventMemberAction
} from "@/lib/actions/event-member";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/ConfirmDiscardDialog";
import { RegistrationFieldManager } from "./RegistrationFieldManager";
import { MemberSheet } from "./MemberSheet";
import { MemberBulkImport } from "./MemberBulkImport";

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
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>(initialMembers);

    // Sync state with server data when props change (e.g. after router.refresh())
    useEffect(() => {
        setMembers(initialMembers);
    }, [initialMembers]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    // Sheets and Dialogs state
    const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
    const [isSendAllConfirmOpen, setIsSendAllConfirmOpen] = useState(false);

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

    const columns: Column<Member>[] = [
        {
            header: "Participant",
            cell: (member) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src="" 
                        alt={member.name}
                        fullName={member.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-md"
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">{member.name}</span>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                            {member.email && <span className="flex items-center gap-1"><Mail className="size-3" /> {member.email}</span>}
                            {member.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {member.phone}</span>}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: "Access Code",
            cell: (member) => (
                <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 bg-muted/50 rounded-lg border-dashed">
                    {member.uniqueCode}
                </Badge>
            ),
        },
        {
            header: "Status",
            cell: (member) => (
                <StatusBadge variant={member.status} />
            ),
        },
        {
            header: "Registered",
            cell: (member) => (
                <span className="text-xs text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </span>
            ),
        },
        {
            header: "",
            className: "text-right",
            cell: (member) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                        <DropdownMenuLabel className="text-[10px] font-bold  tracking-widest">Actions</DropdownMenuLabel>
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
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                                setMemberToDelete(member.id);
                                setIsDeleteConfirmOpen(true);
                            }}
                        >
                            <Trash2 className="size-4 mr-2" />
                            Remove Member
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search participants..."
                        className="pl-10 h-11 rounded-xl bg-muted/30 border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
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

            <DataTable
                icon={<Users className="size-5" />}
                title={`Participants (${members.length})`}
                columns={columns}
                data={filteredMembers}
                keyExtractor={(m) => m.id}
                headerAction={
                    canEdit && (
                        <div className="flex items-center gap-2">
                            <RegistrationFieldManager 
                                eventId={eventId} 
                                fields={registrationFields} 
                                canEdit={canEdit} 
                            />

                            <Button
                                size="sm"
                                variant="tertiary"
                                className="gap-2"
                                onClick={() => {
                                    setEditingMember(null);
                                    setIsMemberSheetOpen(true);
                                }}
                            >
                                <UserPlus className="size-4" />
                                Add Member
                            </Button>

                            <MemberBulkImport 
                                eventId={eventId} 
                                registrationFields={registrationFields}
                                onSuccess={() => {
                                    router.refresh();
                                }}
                            />

                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/5"
                                onClick={() => setIsSendAllConfirmOpen(true)}
                            >
                                <Send className="size-4" />
                                Send Codes
                            </Button>
                        </div>
                    )
                }
                emptyState={
                    <div className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center h-full space-y-2">
                            <Users className="size-8 opacity-20" />
                            <p>No participants found.</p>
                        </div>
                    </div>
                }
            />

            <ConfirmDialog 
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                onConfirm={() => memberToDelete && handleDeleteMember(memberToDelete)}
                title="Remove Participant?"
                description="This will revoke their access code and delete all registration data."
                confirmText="Delete"
                variant="destructive"
            />

            <ConfirmDialog 
                open={isSendAllConfirmOpen}
                onOpenChange={setIsSendAllConfirmOpen}
                onConfirm={() => {
                    startTransition(async () => {
                        const result = await sendCodesAction(eventId);
                        if (result.success) toast.success("Codes sent successfully");
                        else toast.error(result.error);
                    });
                }}
                title="Send Bulk Codes?"
                description="This will send the access codes to ALL participants who have an email address. This action cannot be undone."
                confirmText="Send All"
                variant="primary"
            />

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
