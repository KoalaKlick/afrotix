"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import type { VotingCategory } from "@/lib/types/voting";

interface SortableCategoryItemProps {
    readonly category: VotingCategory;
    readonly canEdit: boolean;
    readonly children: React.ReactNode;
    readonly dragHandleSlot: React.ReactNode;
}

export function SortableCategoryItem({ category, canEdit, children, dragHandleSlot }: SortableCategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 0,
        position: "relative" as const,
    };

    return (
        <div   data-variant="afro" 
                className=" rounded-lg shadow-xs" ref={setNodeRef} style={style} {...attributes}>
            <AccordionItem
           value={category.id}
                
            >
                <div className="flex items-center gap-3 px-4">
                    {canEdit && (
                        <button
                            type="button"
                            aria-label="Drag to reorder category"
                            {...listeners}
                            className="cursor-grab active:cursor-grabbing touch-none p-1 -m-1 hover:bg-muted rounded"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="size-4 text-muted-foreground" />
                        </button>
                    )}
                    <AccordionTrigger className="flex-1 px-0 hover:no-underline">
                        {dragHandleSlot}
                    </AccordionTrigger>
                </div>
                {children}
            </AccordionItem>
        </div>
    );
}
