"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Quote } from "lucide-react"

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value = "", onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }: { editor: Editor }) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none dark:prose-invert',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2 rounded-md border shadow-sm">
            <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-1">
                <Button
                    type="button"
                    variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    aria-label="Toggle bold"
                >
                    <Bold className="size-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    aria-label="Toggle italic"
                >
                    <Italic className="size-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                    type="button"
                    variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    aria-label="Toggle bullet list"
                >
                    <List className="size-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    aria-label="Toggle ordered list"
                >
                    <ListOrdered className="size-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    aria-label="Toggle blockquote"
                >
                    <Quote className="size-4" />
                </Button>
            </div>
            <EditorContent editor={editor} className="p-2" />
        </div>
    );
}
