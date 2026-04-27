/**
 * Event Step 1: Basic Info
 * Title, type, slug, and description
 */

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Ticket, Vote, Layers, Calendar, Sparkles, Lock, Globe, Users } from "lucide-react";
import { validateEventStep1 } from "@/lib/actions/event";
import { EVENT_TYPES, VOTING_MODES, isVotingEventType } from "@/lib/validations/event";
import { cn } from "@/lib/utils";

interface EventStep1Props {
    readonly initialData?: {
        title?: string;
        slug?: string;
        type?: string;
        votingMode?: string;
        description?: string;
    };
    readonly onSuccess: (data: {
        title: string;
        slug: string;
        type: string;
        votingMode?: string;
        description?: string;
    }) => void;
}

const typeIcons = {
    ticketed: Ticket,
    voting: Vote,
    hybrid: Layers,
    standard: Calendar,
};

export function EventStep1BasicInfo({ initialData, onSuccess }: EventStep1Props) {
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [slug, setSlug] = useState(initialData?.slug ?? "");
    const [type, setType] = useState(initialData?.type ?? "ticketed");
    const [votingMode, setVotingMode] = useState(initialData?.votingMode ?? "general");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    // Auto-generate slug from title
    function handleTitleChange(value: string) {
        setTitle(value);
        const generatedSlug = value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 100);
        setSlug(generatedSlug);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrors({});
        setGeneralError(null);

        const formData = new FormData();
        formData.set("title", title);
        formData.set("slug", slug);
        formData.set("type", type);
        if (isVotingEventType(type)) {
            formData.set("votingMode", votingMode);
        }
        formData.set("description", description);

        startTransition(async () => {
            const result = await validateEventStep1(formData);
            if (result.success) {
                onSuccess({
                    title: result.data.title,
                    slug: result.data.slug,
                    type: result.data.type,
                    votingMode: result.data.votingMode,
                    description: result.data.description,
                });
            } else {
                setErrors(result.fieldErrors ?? {});
                if (result.error && !result.fieldErrors) {
                    setGeneralError(result.error);
                }
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {generalError && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {generalError}
                </div>
            )}

            {/* Event Type Selection */}
            <div className="space-y-3">
                <Label>Event Type</Label>
                <div className="grid grid-cols-2 gap-3">
                    {EVENT_TYPES.map((eventType) => {
                        const Icon = typeIcons[eventType.value];
                        const isSelected = type === eventType.value;

                        return (
                            <button
                                key={eventType.value}
                                type="button"
                                onClick={() => setType(eventType.value)}
                                className={cn(
                                    "flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all",
                                    isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-muted hover:border-muted-foreground/30"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className={cn("size-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                                    <span className="font-medium">{eventType.label}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{eventType.description}</p>
                            </button>
                        );
                    })}
                </div>
                {errors.type && (
                    <p className="text-sm text-destructive">{errors.type[0]}</p>
                )}
            </div>

            {/* Voting Mode Selection (only for voting/hybrid events) */}
            {isVotingEventType(type) && (
                <div className="space-y-3">
                    <Label>Voting Mode</Label>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Lock className="size-3" />
                        This cannot be changed after event creation
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {VOTING_MODES.map((mode) => {
                            const isSelected = votingMode === mode.value;
                            const Icon = mode.value === "general" ? Globe : Users;

                            return (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => setVotingMode(mode.value)}
                                    className={cn(
                                        "flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all",
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-muted hover:border-muted-foreground/30"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn("size-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                                        <span className="font-medium">{mode.label}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{mode.description}</p>
                                </button>
                            );
                        })}
                    </div>
                    {errors.votingMode && (
                        <p className="text-sm text-destructive">{errors.votingMode[0]}</p>
                    )}
                </div>
            )}

            {/* Event Title */}
            <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g., Afro Beats Summer Festival 2026"
                    className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                    <p className="text-sm text-destructive">{errors.title[0]}</p>
                )}
            </div>

            {/* Event Slug */}
            <div className="space-y-2">
                <Label htmlFor="slug">Event URL Slug *</Label>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/events/</span>
                    <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="afro-beats-summer-2026"
                        className={cn("flex-1", errors.slug ? "border-destructive" : "")}
                    />
                </div>
                {errors.slug ? (
                    <p className="text-sm text-destructive">{errors.slug[0]}</p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        This will be your event's unique URL
                    </p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell people what your event is about..."
                    rows={4}
                    className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && (
                    <p className="text-sm text-destructive">{errors.description[0]}</p>
                )}
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending || !title || !slug}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Validating...
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="ml-2 size-4" />
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
