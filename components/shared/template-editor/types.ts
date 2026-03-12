/* TemplateEditor Types */

export interface Position {
    x: number;
    y: number;
}

export interface CropRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface TemplateConfig {
    photoX?: number;
    photoY?: number;
    photoWidth?: number;
    photoHeight?: number;
    photoScale?: number;
    cropRect?: CropRect;
}

export interface TemplateEditorProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly templateImage: string;
    readonly photoImage: string;
    readonly templateConfig?: TemplateConfig | null;
    readonly onSave: (finalImageDataUrl: string, config: TemplateConfig) => void;
    readonly isLoading?: boolean;
}

export type EditorStep = "crop" | "place";

export type CropHandle =
    | "nw" | "n" | "ne"
    | "w"          | "e"
    | "sw" | "s" | "se"
    | "body"
    | null;
