"use client";

import {
    Dropzone,
    DropZoneArea,
    DropzoneDescription,
    DropzoneFileList,
    DropzoneFileListItem,
    DropzoneMessage,
    DropzoneRemoveFile,
    DropzoneTrigger,
    useDropzone,
} from "@/components/ui/dropzone";
import { CloudUploadIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Accept } from "react-dropzone";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InitialFile {
    /** The storage path — used as the unique key and passed to onRemoveInitialFile. */
    id: string;
    /** Full public URL for display. */
    url: string;
    /** Optional label shown below the preview. */
    name?: string;
}

export interface ImageDropzoneProps {
    /**
     * Pre-populated files that are already uploaded.
     * Pass `{ id: storagePath, url: getCategoryTemplateImageUrl(path) }` when editing.
     */
    readonly initialFiles?: InitialFile[];

    /** Called with the storage path when the user removes an initial file. */
    readonly onRemoveInitialFile?: (id: string) => void;

    /**
     * Called when a new file is dropped.
     * Must resolve with `{ status: "success", result: storagePath }` — the path,
     * not the full URL — so it can be persisted directly to the DB.
     */
    readonly onDropFile?: (file: File) => Promise<
        | { status: "success"; result: string }
        | { status: "error"; error: string }
    >;

    /**
     * Convert the storage path in `file.result` to a displayable URL.
     * Defaults to using the value as-is.
     * Pass e.g. `getCategoryTemplateImageUrl` here.
     */
    readonly getDisplayUrl?: (path: string) => string | null;

    readonly accept?: Accept;
    readonly maxSize?: number;
    readonly maxFiles?: number;
    readonly description?: string;
    readonly uploadLabel?: string;
    readonly uploadSubLabel?: string;
    readonly gridCols?: "grid-cols-1" | "grid-cols-2" | "grid-cols-3" | "grid-cols-4";
    readonly icon?: React.ReactNode;
    readonly className?: string;
    readonly children?: (state: ReturnType<typeof useDropzone>) => React.ReactNode;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_ACCEPT: Accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".webp"],
};

const DEFAULT_ON_DROP = async (file: File) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { status: "success" as const, result: URL.createObjectURL(file) };
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageDropzone({
    initialFiles = [],
    onRemoveInitialFile,
    onDropFile = DEFAULT_ON_DROP,
    getDisplayUrl,
    accept = DEFAULT_ACCEPT,
    maxSize = 10 * 1024 * 1024,
    maxFiles = 10,
    description,
    uploadLabel = "Upload images",
    uploadSubLabel = "Click here or drag and drop to upload",
    gridCols = "grid-cols-3",
    icon = <CloudUploadIcon className="size-8" />,
    className,
    children,
}: ImageDropzoneProps) {
    const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
    const visibleInitialFiles = initialFiles.filter((f) => !removedIds.has(f.id));

    function handleRemoveInitial(id: string) {
        setRemovedIds((prev) => new Set(prev).add(id));
        onRemoveInitialFile?.(id);
    }

    const dropzone = useDropzone({
        onDropFile,
        validation: { accept, maxSize, maxFiles },
    });

    function resolveDisplayUrl(result: string): string {
        return (getDisplayUrl ? getDisplayUrl(result) : null) ?? result;
    }

    return (
        <div className={`not-prose flex flex-col gap-4 ${className ?? ""}`}>
            <Dropzone {...dropzone}>
                <div>
                    <div className="flex justify-between">
                        <DropzoneDescription>
                            {description ?? `Please select up to ${maxFiles} images`}
                        </DropzoneDescription>
                        <DropzoneMessage />
                    </div>
                    <DropZoneArea>
                        <DropzoneTrigger className="flex flex-col items-center gap-4 bg-transparent p-10 text-center text-sm">
                            {icon}
                            <div>
                                <p className="font-semibold">{uploadLabel}</p>
                                <p className="text-sm text-muted-foreground">{uploadSubLabel}</p>
                            </div>
                        </DropzoneTrigger>
                    </DropZoneArea>
                </div>

                {/* ── Already-uploaded (initial) files ── */}
                {visibleInitialFiles.length > 0 && (
                    <ol className={`grid ${gridCols} gap-3 p-0`}>
                        {visibleInitialFiles.map((file) => (
                            <li
                                key={file.id}
                                className="overflow-hidden rounded-md bg-secondary p-0 shadow-sm"
                            >
                                <div className="relative aspect-video w-full">
                                    <Image
                                        src={file.url}
                                        alt={file.name ?? "uploaded image"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-2 pl-4">
                                    <p className="min-w-0 truncate text-sm">
                                        {file.name ?? file.id}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveInitial(file.id)}
                                        className="shrink-0 rounded p-1 hover:bg-muted"
                                        aria-label="Remove file"
                                    >
                                        <Trash2Icon className="size-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}

                {/* ── Newly-dropped files ── */}
                <DropzoneFileList className={`grid ${gridCols} gap-3 p-0`}>
                    {dropzone.fileStatuses.map((file) => (
                        <DropzoneFileListItem
                            className="overflow-hidden rounded-md bg-secondary p-0 shadow-sm"
                            key={file.id}
                            file={file}
                        >
                            {file.status === "pending" && (
                                <div className="aspect-video animate-pulse bg-black/20" />
                            )}
                            {file.status === "success" && (
                                <div className="relative aspect-video w-full">
                                    <Image
                                        src={resolveDisplayUrl(file.result)}
                                        alt={`uploaded-${file.fileName}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between p-2 pl-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm">{file.fileName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                                <DropzoneRemoveFile className="shrink-0 hover:outline">
                                    <Trash2Icon className="size-4" />
                                </DropzoneRemoveFile>
                            </div>
                        </DropzoneFileListItem>
                    ))}
                </DropzoneFileList>

                {children?.(dropzone)}
            </Dropzone>
        </div>
    );
}