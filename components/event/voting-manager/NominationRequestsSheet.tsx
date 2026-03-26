"use client";

import { useMemo, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Eye } from "lucide-react";
import type { VotingCategory, VotingOption } from "@/lib/types/voting";
import { NominationDetailsDialog } from "./NominationDetailsDialog";

interface NominationRequestsSheetProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly categories: VotingCategory[];
    readonly onApprove: (optionId: string) => void;
    readonly onReject: (optionId: string) => void;
    readonly isPending: boolean;
}

export function NominationRequestsSheet({
    open,
    onOpenChange,
    categories,
    onApprove,
    onReject,
    isPending,
}: NominationRequestsSheetProps) {
    const [selectedOption, setSelectedOption] = useState<{ option: VotingOption; category: VotingCategory } | null>(null);

    // Extract all pending options across all categories
    const pendingNominations = useMemo(() => {
        const pending: { option: VotingOption; categoryName: string }[] = [];
        for (const category of categories) {
            for (const option of category.votingOptions) {
                if (option.status === "pending") {
                    pending.push({ option, categoryName: category.name });
                }
            }
        }
        // Assuming newer nominations are generally appended (or we could sort by created at if we had it)
        return pending.reverse(); 
    }, [categories]);

    return (
        <Sheet  open={open} onOpenChange={onOpenChange}>
            <SheetContent variant="afro" side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Nomination Requests</SheetTitle>
                    <SheetDescription>
                        Review and approve public nominations for your event categories.
                    </SheetDescription>
                </SheetHeader>

                {pendingNominations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
                        <Badge variant="outline" className="mb-4">All caught up</Badge>
                        <p className="font-medium mb-1">No pending requests</p>
                       
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nominee</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingNominations.map(({ option, categoryName }) => (
                                    <TableRow key={option.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-8">
                                                    <AvatarImage src={option.imageUrl ?? undefined} />
                                                    <AvatarFallback>
                                                        {option.optionText.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="font-medium">{option.optionText}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal truncate max-w-[120px]">
                                                {categoryName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                {option.email && <span>{option.email}</span>}
                                                {option.nominatedByName && <span>By: {option.nominatedByName}</span>}
                                                {!option.email && !option.nominatedByName && <span>-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => {
                                                        const category = categories.find(c => c.name === categoryName);
                                                        if (category) {
                                                            setSelectedOption({ option, category });
                                                        }
                                                    }}
                                                    title="View Details"
                                                >
                                                    <Eye className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => onReject(option.id)}
                                                    disabled={isPending}
                                                    title="Reject"
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8 text-green-600 hover:bg-green-600/10 hover:text-green-600"
                                                    onClick={() => onApprove(option.id)}
                                                    disabled={isPending}
                                                    title="Approve"
                                                >
                                                    <Check className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </SheetContent>

            <NominationDetailsDialog 
                selectedOption={selectedOption}
                onClose={() => setSelectedOption(null)}
                onApprove={onApprove}
                onReject={onReject}
                isPending={isPending}
            />
        </Sheet>
    );
}
