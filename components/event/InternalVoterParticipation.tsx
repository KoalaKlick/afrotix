"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Users } from "lucide-react";
import type { VoteParticipant } from "@/lib/dal/voting";

interface InternalVoterParticipationProps {
    readonly participants: VoteParticipant[];
    readonly categoryName?: string;
}

/**
 * Shows which org members have voted vs. haven't in an internal event.
 * NEVER shows which nominee they voted for — only participation status.
 */
export function InternalVoterParticipation({ participants, categoryName }: InternalVoterParticipationProps) {
    const votedCount = participants.filter(p => p.hasVoted).length;
    const totalCount = participants.length;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        Voter Participation
                        {categoryName && <span className="text-muted-foreground"> — {categoryName}</span>}
                    </span>
                </div>
                <Badge variant="secondary" className="font-mono">
                    {votedCount}/{totalCount} voted
                </Badge>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-[#009A44] rounded-full transition-all duration-500"
                    style={{ width: totalCount > 0 ? `${(votedCount / totalCount) * 100}%` : '0%' }}
                />
            </div>

            {/* Member list */}
            <div className="rounded-lg border divide-y bg-card">
                {participants.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                        No organization members found.
                    </div>
                ) : (
                    participants.map((participant) => (
                        <div
                            key={participant.memberId}
                            className="flex items-center justify-between px-4 py-3"
                        >
                            <span className="text-sm font-medium">{participant.fullName}</span>
                            {participant.hasVoted ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                                    <CheckCircle2 className="size-3" />
                                    Voted
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-muted-foreground flex items-center gap-1">
                                    <XCircle className="size-3" />
                                    Not voted
                                </Badge>
                            )}
                        </div>
                    ))
                )}
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
                Vote choices are anonymous — only participation status is shown
            </p>
        </div>
    );
}
