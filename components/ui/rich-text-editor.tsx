"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Heading3, ImageIcon, LinkIcon, Minus } from "lucide-react"
import { useRef, useCallback, useState } from "react"
import { useImageUpload } from "@/lib/hooks/use-image-upload"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const MAX_IMAGES = 2;

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    /** Minimal toolbar (bold, italic, lists, blockquote). Used in forms like nomination. */
    minimal?: boolean;
    /** Maximum number of images allowed. Defaults to MAX_IMAGES (2). */
    maxImages?: number;
    className?: string;
}

export function RichTextEditor({ value = "", onChange, placeholder, minimal = false, maxImages = MAX_IMAGES, className }: RichTextEditorProps) {
    const [imageCount, setImageCount] = useState(() => {
        // Count images in initial value
        const matches = value.match(/<img\s/gi);
        return matches ? matches.length : 0;
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isUploading, upload } = useImageUpload({
        bucket: "events",
        folder: "content",
        convertOptions: { quality: 0.85, maxWidth: 1200, maxHeight: 1200, maxSizeMB: 2 },
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            ImageExtension.configure({
                HTMLAttributes: {
                    class: 'rounded-md max-w-full h-auto my-4',
                },
            }),
            LinkExtension.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline underline-offset-2',
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            }),
        ],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }: { editor: Editor }) => {
            // Track image count on every update
            const html = editor.getHTML();
            const matches = html.match(/<img\s/gi);
            setImageCount(matches ? matches.length : 0);
            onChange?.(html);
        },
        editorProps: {
            attributes: {
                class: cn(
                    'min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none dark:prose-invert',
                    !minimal && 'min-h-[200px]',
                ),
            },
        },
    });

    const isAtImageLimit = imageCount >= maxImages;

    const handleImageUpload = useCallback(async (file: File) => {
        if (!editor) return;

        // Check image limit before uploading
        const currentHtml = editor.getHTML();
        const currentCount = (currentHtml.match(/<img\s/gi) || []).length;
        if (currentCount >= maxImages) {
            toast.error(`Maximum of ${maxImages} images allowed per description.`);
            return;
        }

        // Ensure anonymous sign-in for upload
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const { error } = await supabase.auth.signInAnonymously();
            if (error) return;
        }

        const uploadedPath = await upload(file);
        if (uploadedPath) {
            // Convert storage path to public URL
            const { data } = supabase.storage.from("events").getPublicUrl(uploadedPath);
            if (data?.publicUrl) {
                editor.chain().focus().setImage({ src: data.publicUrl }).run();
            }
        }
    }, [editor, upload, maxImages]);

    const addLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Enter URL', previousUrl || 'https://');

        if (url === null) return; // cancelled
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={cn("flex flex-col gap-0 rounded-md border shadow-sm", className)}>
            <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-1">
                {/* Text formatting */}
                <ToolbarButton
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    label="Toggle bold"
                >
                    <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    label="Toggle italic"
                >
                    <Italic className="size-4" />
                </ToolbarButton>

                {/* Headings — only in full mode */}
                {!minimal && (
                    <>
                        <div className="w-px h-4 bg-border mx-1" />
                        <ToolbarButton
                            active={editor.isActive('heading', { level: 2 })}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            label="Toggle heading 2"
                        >
                            <Heading2 className="size-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            active={editor.isActive('heading', { level: 3 })}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            label="Toggle heading 3"
                        >
                            <Heading3 className="size-4" />
                        </ToolbarButton>
                    </>
                )}

                <div className="w-px h-4 bg-border mx-1" />

                {/* Lists */}
                <ToolbarButton
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    label="Toggle bullet list"
                >
                    <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    label="Toggle ordered list"
                >
                    <ListOrdered className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    label="Toggle blockquote"
                >
                    <Quote className="size-4" />
                </ToolbarButton>

                {/* Advanced — only in full mode */}
                {!minimal && (
                    <>
                        <div className="w-px h-4 bg-border mx-1" />
                        <ToolbarButton
                            active={false}
                            onClick={() => editor.chain().focus().setHorizontalRule().run()}
                            label="Insert horizontal rule"
                        >
                            <Minus className="size-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            active={editor.isActive('link')}
                            onClick={addLink}
                            label="Insert link"
                        >
                            <LinkIcon className="size-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            active={false}
                            onClick={() => fileInputRef.current?.click()}
                            label={isAtImageLimit ? `Image limit reached (${maxImages}/${maxImages})` : "Insert image"}
                            disabled={isUploading || isAtImageLimit}
                        >
                            <ImageIcon className="size-4" />
                            <span className={cn(
                                "absolute -top-1.5 -right-1.5 text-[9px] font-bold min-w-4 h-4 flex items-center justify-center rounded-full",
                                isAtImageLimit
                                    ? "bg-destructive text-destructive-foreground"
                                    : "bg-muted-foreground/20 text-muted-foreground"
                            )}>
                                {imageCount}/{maxImages}
                            </span>
                        </ToolbarButton>
                    </>
                )}
            </div>
            <EditorContent editor={editor} className="p-2" />

            {/* Hidden file input for image uploads */}
            {!minimal && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        e.target.value = "";
                    }}
                />
            )}
        </div>
    );
}

/** Small toolbar button helper */
function ToolbarButton({
    active,
    onClick,
    label,
    disabled,
    children,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Button
            type="button"
            variant={active ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0 relative"
            onClick={onClick}
            aria-label={label}
            disabled={disabled}
        >
            {children}
        </Button>
    );
}
