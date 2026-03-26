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
        <div
            ref={setNodeRef}
            style={style}
            className="relative flex items-center h-full"
        >
            <TabsTrigger
                value={category.id}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 h-full rounded-none border-b-2 border-transparent transition-all",
                    "data-[state=active]:border-primary data-[state=active]:bg-background/50",
                    "hover:bg-muted/50",
                    isDragging && "opacity-50"
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
        </div>
    );
}
