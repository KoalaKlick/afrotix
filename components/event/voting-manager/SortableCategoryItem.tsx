import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TabsTrigger } from "@/components/ui/tabs";
import type { VotingCategory } from "@/lib/types/voting";
import { cn } from "@/lib/utils";

interface SortableCategoryItemProps {
    readonly category: VotingCategory;
    readonly canEdit: boolean;
}

export function SortableCategoryItem({ category, canEdit }: SortableCategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <TabsTrigger
            ref={setNodeRef}
            style={style}
            value={category.id}
            className={cn(
                "relative flex items-center gap-1.5 h-6.5",
                isDragging && "opacity-50 shadow-md ring-2 ring-primary/20 cursor-grabbing"
            )}
        >
            {canEdit && (
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 hover:bg-muted rounded text-muted-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="size-3.5" />
                </div>
            )}
            <span className="font-medium whitespace-nowrap">{category.name}</span>
        </TabsTrigger>
    );
}
