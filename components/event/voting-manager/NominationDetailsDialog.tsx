"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import type { VotingCategory, VotingOption } from "@/lib/types/voting";
import { getEventImageUrl } from "@/lib/image-url-utils";

interface NominationDetailsDialogProps {
    readonly selectedOption: { option: VotingOption; category: VotingCategory } | null;
    readonly onClose: () => void;
    readonly onApprove: (optionId: string) => void;
    readonly onReject: (optionId: string) => void;
    readonly isPending: boolean;
}

export function NominationDetailsDialog({
    selectedOption,
    onClose,
    onApprove,
    onReject,
    isPending,
}: NominationDetailsDialogProps) {
    return (
        <Dialog open={!!selectedOption} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col pl-6">
                <DialogHeader>
                    <DialogTitle>Nomination Details</DialogTitle>
                    <DialogDescription>
                        Review the full information provided by the nominator.
                    </DialogDescription>
                </DialogHeader>
                {selectedOption && (
                    <div className="flex-1 pr-4 overflow-y-auto">
                        <div className="space-y-6 pb-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="size-24 rounded-md">
                                    <AvatarImage src={getEventImageUrl(selectedOption.option.imageUrl) ?? undefined} className="object-cover" />
                                    <AvatarFallback className="rounded-md text-xl">
                                        {selectedOption.option.optionText.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-semibold leading-none">{selectedOption.option.optionText}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        For {selectedOption.category.name}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 bg-muted/30 p-4 rounded-lg">
                                {selectedOption.option.email && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nominee Email</p>
                                        <p className="text-sm font-medium">{selectedOption.option.email}</p>
                                    </div>
                                )}
                            </div>

                            {selectedOption.option.description && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description / Pitch</p>
                                    <div
                                        className="text-sm bg-muted/30 p-3 rounded-lg leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: selectedOption.option.description }}
                                    />
                                </div>
                            )}

                            {selectedOption.category.customFields && selectedOption.category.customFields.length > 0 && selectedOption.option.fieldValues && selectedOption.option.fieldValues.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider border-b pb-1">Additional Information</p>
                                    <div className="space-y-3">
                                        {selectedOption.category.customFields.map((field: any) => {
                                            const val = selectedOption.option.fieldValues?.find((f: any) => f.fieldId === field.id)?.value;
                                            if (!val) return null;
                                            return (
                                                <div key={field.id} className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground">{field.fieldLabel}</p>
                                                    <p className="text-sm font-medium">{val}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}


                            {(selectedOption.option.nominatedByName || (selectedOption.option as any).nominatedByEmail) && (
                                <div className="space-y-2">
                                    <p className="text-sm">Nominated By</p>
                                    <Card variant="afro" className=" border-0 shadow-xs p-2 w-fit">

                                        <CardContent className="">

                                            <div className="">{selectedOption.option.nominatedByName && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">{selectedOption.option.nominatedByName}</p>
                                                </div>
                                            )}
                                                {(selectedOption.option as any).nominatedByEmail && (
                                                    <div className="space-y-1">
                                                        <p className="text-sm ">{(selectedOption.option as any).nominatedByEmail}</p>
                                                    </div>
                                                )}</div>

                                        </CardContent>
                                    </Card>
                                </div>

                            )}
                        </div>
                    </div>
                )}
                <DialogFooter className="space-x-2 sm:gap-0 mt-2">
                    <Button
                    
                        variant="destructive"
                        onClick={() => {
                            if (selectedOption) onReject(selectedOption.option.id);
                            onClose();
                        }}
                        disabled={isPending}
                    >
                        <X className="size-4 mr-2" />
                        Reject
                    </Button>
                    <Button
                    variant='tertiary'
                        onClick={() => {
                            if (selectedOption) onApprove(selectedOption.option.id);
                            onClose();
                        }}
                        disabled={isPending}
                    >
                        <Check className="size-4 mr-2" />
                        Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
