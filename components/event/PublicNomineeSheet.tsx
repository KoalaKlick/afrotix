"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { Vote, Share2, Users, Hash } from "lucide-react";
import type { VotingOption } from "@/lib/types/voting";
import { VotePaymentModal } from "@/components/event/VotePaymentModal";

// ─── Strip HTML for plain-text share messages ────────────────────────────────

function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent?.trim() || "";
}

// ─── Convert any image blob to JPEG via canvas ──────────────────────────────

function convertToJpeg(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) { URL.revokeObjectURL(url); reject(new Error("no canvas ctx")); return; }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
                (jpegBlob) => {
                    URL.revokeObjectURL(url);
                    if (jpegBlob) resolve(jpegBlob);
                    else reject(new Error("toBlob failed"));
                },
                "image/jpeg",
                0.92
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
        img.src = url;
    });
}

// ─── Rich share: image + description + vote link ─────────────────────────────

async function shareNominee(nominee: VotingOption) {
    const imageUrl = getEventImageUrl(nominee.imageUrl);
    const plainDescription = nominee.description ? stripHtml(nominee.description) : "";
    const shareUrl = window.location.href;

    // Build share text: nominee name + description
    let shareCaption = `Vote for ${nominee.optionText}!`;
    if (plainDescription) shareCaption += `\n\n${plainDescription}`;

    // Try to share with image converted to JPEG for WhatsApp compatibility
    if (imageUrl && navigator.canShare) {
        try {
            const response = await fetch(imageUrl);
            const originalBlob = await response.blob();
            const jpegBlob = await convertToJpeg(originalBlob);

            const file = new File(
                [jpegBlob],
                `${nominee.optionText.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`,
                { type: "image/jpeg" }
            );

            // Share image with caption text (single text field = WhatsApp caption)
            const shareData: ShareData = {
                text: shareCaption + `\n\n${shareUrl}`,
                files: [file],
            };

            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return;
            }
        } catch {
            // Fall through to text-only share
        }
    }

    // Fallback: text-only share or clipboard
    if (navigator.share) {
        navigator.share({ title: nominee.optionText, text: shareCaption + `\n\n${shareUrl}` }).catch(() => { });
    } else {
        await navigator.clipboard.writeText(shareCaption + `\n\n${shareUrl}`);
    }
}

// ─── Nominee Grid (client wrapper for click-to-open) ─────────────────────────

interface NomineeGridProps {
    readonly nominees: VotingOption[];
    readonly votePrice?: number;
    readonly eventId: string;
    readonly categoryId: string;
    readonly isPublic?: boolean;
    readonly votingMode?: "internal" | "public";
    readonly showTotalVotesPublicly?: boolean;
}

export function NomineeGrid({ nominees, votePrice = 0, eventId, categoryId, isPublic, votingMode = "public", showTotalVotesPublicly = true }: NomineeGridProps) {
    const [selectedNominee, setSelectedNominee] = useState<VotingOption | null>(null);
    const [votingNominee, setVotingNominee] = useState<VotingOption | null>(null);

    function handleShare(e: React.MouseEvent, nominee: VotingOption) {
        e.stopPropagation();
        shareNominee(nominee);
    }

    return (
        <>
            <div className="grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 @7xl:grid-cols-5 @[90rem]:grid-cols-6 gap-6">
                {nominees.map((nominee) => {
                    const displayImageUrl = getEventImageUrl(nominee.imageUrl);
                    return (
                        <div
                            key={nominee.id}
                            onClick={() => setSelectedNominee(nominee)}
                            className="group bg-white rounded-md overflow-hidden border shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer"
                        >
                            {/* Image */}
                            <div className="relative aspect-5/4 bg-linear-to-br from-[#009A44]/10 to-[#FFCD00]/10">
                                {displayImageUrl ? (
                                    <Image
                                        src={displayImageUrl}
                                        alt={nominee.optionText}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Users className="w-16 h-16 text-muted-foreground/20" />
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-base truncate">{nominee.optionText}</h3>
                                        {nominee.nomineeCode && (
                                            <p className="text-xs text-[#009A44] font-mono font-semibold mt-0.5">
                                                {nominee.nomineeCode}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => handleShare(e, nominee)}
                                            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                                            title="Share"
                                        >
                                            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-[#009A44]/10 flex items-center justify-center group-hover:bg-[#009A44] transition-colors">
                                            <Vote className="w-3.5 h-3.5 text-[#009A44] group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </div>
                                {/* Vote Button */}
                                <Button
                                    variant="afro"
                                    size="sm"
                                    className="w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setVotingNominee(nominee);
                                    }}
                                >
                                    <Vote className="w-3.5 h-3.5" />
                                    Vote {votingMode === "public" && votePrice > 0 ? `(GHS ${votePrice.toFixed(2)})` : ""}  
                                </Button>
                                {showTotalVotesPublicly && (
                                    <div className="mt-3 pt-3 border-t flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{Number(nominee.votesCount).toLocaleString()} votes</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Nominee Details Sheet */}
            <PublicNomineeSheet
                nominee={selectedNominee}
                open={!!selectedNominee}
                onOpenChange={(open) => {
                    if (!open) setSelectedNominee(null);
                }}
                votePrice={votePrice}
                onVote={(nominee) => {
                    setSelectedNominee(null);
                    setVotingNominee(nominee);
                }}
                showTotalVotesPublicly={showTotalVotesPublicly}
            />

            {/* Vote Payment Modal */}
            <VotePaymentModal
                nominee={votingNominee}
                open={!!votingNominee}
                onOpenChange={(open) => {
                    if (!open) setVotingNominee(null);
                }}
                votePrice={votePrice}
                eventId={eventId}
                categoryId={categoryId}
                isPublic={isPublic}
                votingMode={votingMode}
            />
        </>
    );
}

// ─── Nominee Detail Sheet ─────────────────────────────────────────────────────

interface PublicNomineeSheetProps {
    readonly nominee: VotingOption | null;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly votePrice?: number;
    readonly onVote?: (nominee: VotingOption) => void;
    readonly showTotalVotesPublicly?: boolean;
}

function PublicNomineeSheet({ nominee, open, onOpenChange, votePrice = 0, onVote, showTotalVotesPublicly = true }: PublicNomineeSheetProps) {
    if (!nominee) return null;

    const displayImageUrl = getEventImageUrl(nominee.imageUrl);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col w-full gap-0 h-full p-0 sm:max-w-lg">
                {/* Sticky Header */}
                <SheetHeader className="px-6 py-4 border-b shrink-0">
                    <SheetTitle className="text-left">{nominee.optionText}</SheetTitle>
                </SheetHeader>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Image */}
                    {displayImageUrl && (
                        <div className="relative w-full aspect-square bg-muted">
                            <Image
                                src={displayImageUrl}
                                alt={nominee.optionText}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    )}

                    <div className="p-6 space-y-6">
                        {/* Name & Code */}
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">{nominee.optionText}</h2>
                            {nominee.nomineeCode && (
                                <p className="text-sm text-[#009A44] font-mono font-bold mt-1 flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5" />
                                    {nominee.nomineeCode}
                                </p>
                            )}
                        </div>
                        {/* Description / Pitch */}
                        {nominee.description && (
                            <div className="space-y-2">

                                <div
                                    className="prose prose-sm max-w-none text-foreground"
                                    dangerouslySetInnerHTML={{ __html: nominee.description }}
                                />
                            </div>
                        )}

                        {/* Vote Count Stats (Public) */}
                        {showTotalVotesPublicly && (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#009A44]/5 border border-[#009A44]/10">
                                <div className="w-12 h-12 rounded-full bg-[#009A44]/10 flex items-center justify-center shrink-0">
                                    <Users className="w-6 h-6 text-[#009A44]" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[#009A44] leading-none">
                                        {Number(nominee.votesCount).toLocaleString()}
                                    </p>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                                        Total Votes Received
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="border-t p-6 shrink-0 flex gap-3">
                    <Button
                        className="grow"
                        variant="afro"
                        size="lg"
                        onClick={() => {
                            if (onVote) onVote(nominee);
                        }}
                    >
                        <Vote className="w-4 h-4" />
                        Vote for {nominee.optionText} {votePrice > 0 ? `(GHS ${votePrice.toFixed(2)})` : ""}
                    </Button>
                    <Button
                        variant="tertiary"
                        size="lg"
                        onClick={() => shareNominee(nominee)}
                    >
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
