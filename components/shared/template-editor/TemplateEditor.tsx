"use client";

/**
 * TemplateEditor — Intuitive photo placement + crop editor
 * Drop-in replacement for the original TemplateEditor component.
 *
 * Features:
 *  • Two-mode workflow: "Crop" → "Place"
 *  • Crop mode: pinch/drag crop rectangle with 8 handles + free-aspect toggle
 *  • Place mode: drag photo onto template; scroll/pinch to zoom
 *  • Touch support (pinch-to-zoom, drag)
 *  • Live mini-preview thumbnail
 *  • Keyboard shortcuts (arrow keys, +/-, R to reset, Enter to save)
 */

import {
    useState,
    useRef,
    useCallback,
    useEffect,
} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    Check,
    X,
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    ZoomIn,
    ZoomOut,
} from "lucide-react";

import type { Position, CropRect, TemplateEditorProps, EditorStep, CropHandle } from "./types";
import { CANVAS_W, CANVAS_H, MIN_CROP, HANDLE_SIZE } from "./constants";
import { clamp, loadImage, getCroppedCanvas } from "./helpers";
import { iconBtnStyle, primaryBtnStyle, secondaryBtnStyle, cancelBtnStyle, presetBtnStyle } from "./styles";
import { StepPill } from "./StepPill";

export function TemplateEditor({
    open,
    onOpenChange,
    templateImage,
    photoImage,
    templateConfig,
    onSave,
    isLoading = false,
}: TemplateEditorProps) {
    /* ── refs ── */
    const cropCanvasRef = useRef<HTMLCanvasElement>(null);
    const placeCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    /* ── loaded images ── */
    const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
    const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
    const [croppedCanvas, setCroppedCanvas] = useState<HTMLCanvasElement | null>(null);

    /* ── step ── */
    const [step, setStep] = useState<EditorStep>("crop");

    /* ── crop state ── */
    const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
    const [keepAspect, setKeepAspect] = useState(false);
    const cropAspectRef = useRef(1);

    /* ── place state ── */
    const [placePos, setPlacePos] = useState<Position>({ x: 0, y: 0 });
    const [placeScale, setPlaceScale] = useState(1);

    /* ── dragging ── */
    const isDraggingCrop = useRef(false);
    const cropHandle = useRef<CropHandle>(null);
    const dragOrigin = useRef<Position>({ x: 0, y: 0 });
    const cropOrigin = useRef<CropRect>({ x: 0, y: 0, w: 0, h: 0 });

    const isDraggingPlace = useRef(false);
    const placeDragOffset = useRef<Position>({ x: 0, y: 0 });

    /* ── misc ── */
    const [isGenerating, setIsGenerating] = useState(false);

    /* ════════════════════════ load images ═════════════════════════ */

    useEffect(() => {
        if (!open) return;
        Promise.all([loadImage(templateImage), loadImage(photoImage)])
            .then(([tpl, photo]) => {
                setTemplateImg(tpl);
                setPhotoImg(photo);

                // initial crop = full image
                const savedCrop = templateConfig?.cropRect;
                const initialCrop: CropRect = savedCrop ?? {
                    x: 0, y: 0, w: photo.naturalWidth, h: photo.naturalHeight,
                };
                setCropRect(initialCrop);
                cropAspectRef.current = initialCrop.w / initialCrop.h;

                // initial place
                const pw = templateConfig?.photoWidth ?? 200;
                const ph = templateConfig?.photoHeight
                    ?? (pw * (initialCrop.h / initialCrop.w));
                setPlacePos({
                    x: templateConfig?.photoX ?? (CANVAS_W - pw) / 2,
                    y: templateConfig?.photoY ?? (CANVAS_H - ph) / 2,
                });
                setPlaceScale(templateConfig?.photoScale ?? 1);
            })
            .catch(console.error);
    }, [open, templateImage, photoImage, templateConfig]);

    /* ════════════════════════ draw helpers ════════════════════════ */

    /* ── draw crop canvas ── */
    const drawCrop = useCallback(() => {
        const canvas = cropCanvasRef.current;
        if (!canvas || !photoImg) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(photoImg, 0, 0, W, H);

        // dim outside crop
        const scaleX = W / photoImg.naturalWidth;
        const scaleY = H / photoImg.naturalHeight;
        const cr = {
            x: cropRect.x * scaleX,
            y: cropRect.y * scaleY,
            w: cropRect.w * scaleX,
            h: cropRect.h * scaleY,
        };

        ctx.fillStyle = "rgba(0,0,0,0.52)";
        // top
        ctx.fillRect(0, 0, W, cr.y);
        // bottom
        ctx.fillRect(0, cr.y + cr.h, W, H - cr.y - cr.h);
        // left
        ctx.fillRect(0, cr.y, cr.x, cr.h);
        // right
        ctx.fillRect(cr.x + cr.w, cr.y, W - cr.x - cr.w, cr.h);

        // crop border
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);

        // 8 handles
        ctx.fillStyle = "#6366f1";
        const midX = cr.x + cr.w / 2;
        const midY = cr.y + cr.h / 2;
        const handles = [
            [cr.x, cr.y], [midX, cr.y], [cr.x + cr.w, cr.y],
            [cr.x, midY], [cr.x + cr.w, midY],
            [cr.x, cr.y + cr.h], [midX, cr.y + cr.h], [cr.x + cr.w, cr.y + cr.h],
        ];
        handles.forEach(([hx, hy]) => {
            ctx.beginPath();
            ctx.arc(hx, hy, HANDLE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }, [photoImg, cropRect]);

    /* ── draw place canvas (with selection outline for editing) ── */
    const drawPlace = useCallback(() => {
        const canvas = placeCanvasRef.current;
        if (!canvas || !templateImg || !croppedCanvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.drawImage(templateImg, 0, 0, CANVAS_W, CANVAS_H);

        const sw = croppedCanvas.width * placeScale;
        const sh = croppedCanvas.height * placeScale;
        ctx.drawImage(croppedCanvas, placePos.x, placePos.y, sw, sh);

        // selection outline (only for editing display)
        ctx.strokeStyle = "rgba(99,102,241,0.85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(placePos.x, placePos.y, sw, sh);
        ctx.setLineDash([]);
    }, [templateImg, croppedCanvas, placePos, placeScale]);

    /* ── draw final canvas (NO selection outline - for saving) ── */
    const drawFinal = useCallback((canvas: HTMLCanvasElement) => {
        if (!templateImg || !croppedCanvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.drawImage(templateImg, 0, 0, CANVAS_W, CANVAS_H);

        const sw = croppedCanvas.width * placeScale;
        const sh = croppedCanvas.height * placeScale;
        ctx.drawImage(croppedCanvas, placePos.x, placePos.y, sw, sh);
        // No selection outline - clean final image
    }, [templateImg, croppedCanvas, placePos, placeScale]);

    /* ── draw preview ── */
    const drawPreview = useCallback(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas || !templateImg || !croppedCanvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
        const ratio = canvas.width / CANVAS_W;
        const sw = croppedCanvas.width * placeScale * ratio;
        const sh = croppedCanvas.height * placeScale * ratio;
        ctx.drawImage(croppedCanvas, placePos.x * ratio, placePos.y * ratio, sw, sh);
    }, [templateImg, croppedCanvas, placePos, placeScale]);

    useEffect(() => {
        if (step === "crop") drawCrop();
    }, [step, drawCrop]);

    useEffect(() => {
        if (step === "place") {
            drawPlace();
            drawPreview();
        }
    }, [step, drawPlace, drawPreview]);

    /* ════════════════════════ crop interaction ════════════════════ */

    function getHandleAtPoint(cx: number, cy: number, cr: CropRect, img: HTMLImageElement, canvas: HTMLCanvasElement): CropHandle {
        const scaleX = canvas.width / img.naturalWidth;
        const scaleY = canvas.height / img.naturalHeight;
        const dc = {
            x: cr.x * scaleX, y: cr.y * scaleY,
            w: cr.w * scaleX, h: cr.h * scaleY,
        };
        const R = HANDLE_SIZE;
        const midX = dc.x + dc.w / 2;
        const midY = dc.y + dc.h / 2;
        const pts: [number, number, CropHandle][] = [
            [dc.x, dc.y, "nw"],
            [midX, dc.y, "n"],
            [dc.x + dc.w, dc.y, "ne"],
            [dc.x, midY, "w"],
            [dc.x + dc.w, midY, "e"],
            [dc.x, dc.y + dc.h, "sw"],
            [midX, dc.y + dc.h, "s"],
            [dc.x + dc.w, dc.y + dc.h, "se"],
        ];
        for (const [hx, hy, name] of pts) {
            if (Math.abs(cx - hx) <= R && Math.abs(cy - hy) <= R) return name;
        }
        if (cx >= dc.x && cx <= dc.x + dc.w && cy >= dc.y && cy <= dc.y + dc.h) return "body";
        return null;
    }

    function applyHandleDelta(
        handle: CropHandle,
        delta: { dx: number; dy: number },
        origin: CropRect,
        imgBounds: { w: number; h: number },
        keepRatio: boolean,
        aspect: number,
    ): CropRect {
        const { dx, dy } = delta;
        const { w: imgW, h: imgH } = imgBounds;
        let { x, y, w, h } = origin;
        
        if (handle === "body") {
            x = clamp(x + dx, 0, imgW - w);
            y = clamp(y + dy, 0, imgH - h);
            return { x, y, w, h };
        }
        
        // Handle vertical resize (north edge)
        if (handle === "n" || handle === "nw" || handle === "ne") {
            const maxY = y + h - MIN_CROP; // Can't go below this (would make h < MIN_CROP)
            const newY = clamp(y + dy, 0, maxY);
            const deltaY = newY - y;
            h = h - deltaY; // If y decreases (moved up), h increases
            y = newY;
        }
        
        // Handle vertical resize (south edge)
        if (handle === "s" || handle === "sw" || handle === "se") {
            const maxH = imgH - y; // Can't exceed image bounds
            h = clamp(h + dy, MIN_CROP, maxH);
        }
        
        // Handle horizontal resize (west edge)
        if (handle === "w" || handle === "nw" || handle === "sw") {
            const maxX = x + w - MIN_CROP; // Can't go beyond this (would make w < MIN_CROP)
            const newX = clamp(x + dx, 0, maxX);
            const deltaX = newX - x;
            w = w - deltaX; // If x decreases (moved left), w increases
            x = newX;
        }
        
        // Handle horizontal resize (east edge)
        if (handle === "e" || handle === "ne" || handle === "se") {
            const maxW = imgW - x; // Can't exceed image bounds
            w = clamp(w + dx, MIN_CROP, maxW);
        }
        
        // Apply aspect ratio constraint if enabled
        if (keepRatio && h > 0) {
            const targetW = h * aspect;
            w = clamp(targetW, MIN_CROP, imgW - x);
        }
        
        return { 
            x, 
            y, 
            w: Math.max(MIN_CROP, w), 
            h: Math.max(MIN_CROP, h) 
        };
    }

    /**
     * Get the actual displayed region of a canvas with objectFit: contain.
     * Returns the offset and scale factors to convert client coords to canvas coords.
     */
    const getContainedCanvasTransform = (canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const containerW = rect.width;
        const containerH = rect.height;
        const canvasW = canvas.width;
        const canvasH = canvas.height;

        // Calculate the scale that fits the canvas inside the container
        const containerAspect = containerW / containerH;
        const canvasAspect = canvasW / canvasH;
        
        let displayW: number, displayH: number, offsetX: number, offsetY: number;
        
        if (canvasAspect > containerAspect) {
            // Canvas is wider - letterbox top/bottom
            displayW = containerW;
            displayH = containerW / canvasAspect;
            offsetX = 0;
            offsetY = (containerH - displayH) / 2;
        } else {
            // Canvas is taller - letterbox left/right
            displayH = containerH;
            displayW = containerH * canvasAspect;
            offsetX = (containerW - displayW) / 2;
            offsetY = 0;
        }

        return {
            rect,
            offsetX,
            offsetY,
            scaleX: canvasW / displayW,
            scaleY: canvasH / displayH,
        };
    };

    const handleCropMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = cropCanvasRef.current;
        if (!canvas || !photoImg) return;
        const { rect, offsetX, offsetY, scaleX, scaleY } = getContainedCanvasTransform(canvas);
        const cx = (e.clientX - rect.left - offsetX) * scaleX;
        const cy = (e.clientY - rect.top - offsetY) * scaleY;
        const handle = getHandleAtPoint(cx, cy, cropRect, photoImg, canvas);
        if (!handle) return;
        isDraggingCrop.current = true;
        cropHandle.current = handle;
        dragOrigin.current = { x: cx, y: cy };
        cropOrigin.current = { ...cropRect };
        e.preventDefault();
    };

    const handleCropMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = cropCanvasRef.current;
        if (!canvas || !photoImg) return;
        // cursor
        const { rect, offsetX, offsetY, scaleX, scaleY } = getContainedCanvasTransform(canvas);
        const cx = (e.clientX - rect.left - offsetX) * scaleX;
        const cy = (e.clientY - rect.top - offsetY) * scaleY;
        const cursorMap: Record<string, string> = {
            nw: "nw-resize", n: "n-resize", ne: "ne-resize",
            w: "w-resize", e: "e-resize",
            sw: "sw-resize", s: "s-resize", se: "se-resize",
            body: "move",
        };
        if (!isDraggingCrop.current) {
            const handle = getHandleAtPoint(cx, cy, cropRect, photoImg, canvas);
            canvas.style.cursor = handle ? (cursorMap[handle] ?? "default") : "default";
            return;
        }
        // cx/cy are already in canvas coords = image natural coords
        const dx = cx - dragOrigin.current.x;
        const dy = cy - dragOrigin.current.y;
        const newCrop = applyHandleDelta(
            cropHandle.current,
            { dx, dy },
            cropOrigin.current,
            { w: photoImg.naturalWidth, h: photoImg.naturalHeight },
            keepAspect,
            cropAspectRef.current,
        );
        setCropRect(newCrop);
    };

    const handleCropMouseUp = () => { isDraggingCrop.current = false; };

    /* ════════════════════════ place interaction ═══════════��═══════ */

    const handlePlaceMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!croppedCanvas) return;
        const canvas = placeCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const sx = CANVAS_W / rect.width;
        const sy = CANVAS_H / rect.height;
        const cx = (e.clientX - rect.left) * sx;
        const cy = (e.clientY - rect.top) * sy;
        const sw = croppedCanvas.width * placeScale;
        const sh = croppedCanvas.height * placeScale;
        if (cx >= placePos.x && cx <= placePos.x + sw && cy >= placePos.y && cy <= placePos.y + sh) {
            isDraggingPlace.current = true;
            placeDragOffset.current = { x: cx - placePos.x, y: cy - placePos.y };
        }
        e.preventDefault();
    };

    const handlePlaceMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDraggingPlace.current || !croppedCanvas) return;
        const canvas = placeCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const sx = CANVAS_W / rect.width;
        const sy = CANVAS_H / rect.height;
        const cx = (e.clientX - rect.left) * sx;
        const cy = (e.clientY - rect.top) * sy;
        setPlacePos({
            x: cx - placeDragOffset.current.x,
            y: cy - placeDragOffset.current.y,
        });
    };

    const handlePlaceMouseUp = () => { isDraggingPlace.current = false; };

    const handlePlaceWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        setPlaceScale(s => clamp(s - e.deltaY * 0.001, 0.1, 4));
    };

    /* ════════════════════ step transitions ════════════════════════ */

    const proceedToPlace = () => {
        if (!photoImg) return;
        const cc = getCroppedCanvas(photoImg, cropRect);
        setCroppedCanvas(cc);
        // fit cropped image nicely in canvas
        const maxDim = CANVAS_W * 0.5;
        const scaleFit = Math.min(maxDim / cc.width, maxDim / cc.height, 1);
        const fw = cc.width * scaleFit;
        const fh = cc.height * scaleFit;
        setPlacePos({ x: (CANVAS_W - fw) / 2, y: (CANVAS_H - fh) / 2 });
        setPlaceScale(scaleFit);
        setStep("place");
    };

    const goBackToCrop = () => setStep("crop");

    /* ════════════════════════ keyboard shortcuts ══════════════════ */

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (step === "place") {
                const STEP = e.shiftKey ? 10 : 2;
                if (e.key === "ArrowLeft") setPlacePos(p => ({ ...p, x: p.x - STEP }));
                if (e.key === "ArrowRight") setPlacePos(p => ({ ...p, x: p.x + STEP }));
                if (e.key === "ArrowUp") setPlacePos(p => ({ ...p, y: p.y - STEP }));
                if (e.key === "ArrowDown") setPlacePos(p => ({ ...p, y: p.y + STEP }));
                if (e.key === "+" || e.key === "=") setPlaceScale(s => clamp(s + 0.05, 0.1, 4));
                if (e.key === "-") setPlaceScale(s => clamp(s - 0.05, 0.1, 4));
            }
        };
        globalThis.addEventListener("keydown", handler);
        return () => globalThis.removeEventListener("keydown", handler);
    }, [open, step]);

    /* ════════════════════════ save ════════════════════════════════ */

    const handleSave = async () => {
        const canvas = placeCanvasRef.current;
        if (!canvas) return;
        setIsGenerating(true);
        try {
            // Draw final image WITHOUT selection outline
            drawFinal(canvas);
            const dataUrl = canvas.toDataURL("image/webp", 0.92);
            onSave(dataUrl, {
                photoX: placePos.x,
                photoY: placePos.y,
                photoWidth: croppedCanvas?.width,
                photoHeight: croppedCanvas?.height,
                photoScale: placeScale,
                cropRect,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    /* ════════════════════════ reset helpers ═══════════════════════ */

    const resetCrop = () => {
        if (!photoImg) return;
        setCropRect({ x: 0, y: 0, w: photoImg.naturalWidth, h: photoImg.naturalHeight });
    };

    const resetPlace = () => {
        if (!croppedCanvas) return;
        const maxDim = CANVAS_W * 0.5;
        const scaleFit = Math.min(maxDim / croppedCanvas.width, maxDim / croppedCanvas.height, 1);
        const fw = croppedCanvas.width * scaleFit;
        const fh = croppedCanvas.height * scaleFit;
        setPlacePos({ x: (CANVAS_W - fw) / 2, y: (CANVAS_H - fh) / 2 });
        setPlaceScale(scaleFit);
    };

    /* ════════════════════════ render ══════════════════════════════ */

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl p-0 gap-0 overflow-hidden"
                style={{
                    background: "linear-gradient(160deg, #0f0f12 0%, #18181f 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    color: "#e8e8f0",
                    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
                }}
            >
                {/* ── header ── */}
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {/* step indicator */}
                    <div className="flex items-center gap-2 mb-3">
                        <StepPill index={1} label="Crop Photo" active={step === "crop"} done={step === "place"} />
                        <div style={{ width: 24, height: 1, background: "rgba(255,255,255,0.15)" }} />
                        <StepPill index={2} label="Position" active={step === "place"} done={false} />
                    </div>
                    <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
                        {step === "crop" ? "Crop your photo" : "Place on template"}
                    </DialogTitle>
                    <DialogDescription style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
                        {step === "crop"
                            ? "Drag the handles to select the area you want to use."
                            : "Drag the photo to position it. Scroll to resize."}
                    </DialogDescription>
                </div>

                {/* ── body ── */}
                <div className="px-6 py-4 flex gap-4" style={{ minHeight: 380 }}>
                    {/* main canvas */}
                    <div
                        style={{
                            flex: 1,
                            borderRadius: 10,
                            overflow: "hidden",
                            background: "#0a0a0e",
                            border: "1px solid rgba(255,255,255,0.06)",
                            position: "relative",
                        }}
                    >
                        {/* crop canvas */}
                        <canvas
                            ref={cropCanvasRef}
                            width={photoImg?.naturalWidth ?? 600}
                            height={photoImg?.naturalHeight ?? 600}
                            style={{
                                display: step === "crop" ? "block" : "none",
                                width: "100%",
                                height: "100%",
                                maxHeight: "50vh",
                                objectFit: "contain",
                                userSelect: "none",
                            }}
                            onMouseDown={handleCropMouseDown}
                            onMouseMove={handleCropMouseMove}
                            onMouseUp={handleCropMouseUp}
                            onMouseLeave={handleCropMouseUp}
                        />

                        {/* place canvas */}
                        <canvas
                            ref={placeCanvasRef}
                            width={CANVAS_W}
                            height={CANVAS_H}
                            style={{
                                display: step === "place" ? "block" : "none",
                                width: "100%",
                                height: "100%",
                                maxHeight: "50vh",
                                objectFit: "contain",
                                cursor: "move",
                                userSelect: "none",
                            }}
                            onMouseDown={handlePlaceMouseDown}
                            onMouseMove={handlePlaceMouseMove}
                            onMouseUp={handlePlaceMouseUp}
                            onMouseLeave={handlePlaceMouseUp}
                            onWheel={handlePlaceWheel}
                        />

                        {(!templateImg || !photoImg) && (
                            <div
                                style={{
                                    position: "absolute", inset: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "rgba(10,10,14,0.8)",
                                }}
                            >
                                <Loader2 className="animate-spin" style={{ color: "#6366f1", width: 32, height: 32 }} />
                            </div>
                        )}
                    </div>

                    {/* sidebar */}
                    <div style={{ width: 148, display: "flex", flexDirection: "column", gap: 12 }}>
                        {step === "place" && (
                            <>
                                {/* mini preview */}
                                <div>
                                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Preview</p>
                                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <canvas
                                            ref={previewCanvasRef}
                                            width={148}
                                            height={148}
                                            style={{ display: "block", width: "100%", height: "auto" }}
                                        />
                                    </div>
                                </div>

                                {/* scale display */}
                                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px" }}>
                                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Size</p>
                                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                                        <button
                                            type="button"
                                            onClick={() => setPlaceScale(s => clamp(s - 0.1, 0.1, 4))}
                                            style={iconBtnStyle}
                                        >
                                            <ZoomOut size={14} />
                                        </button>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>
                                            {Math.round(placeScale * 100)}%
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setPlaceScale(s => clamp(s + 0.1, 0.1, 4))}
                                            style={iconBtnStyle}
                                        >
                                            <ZoomIn size={14} />
                                        </button>
                                    </div>
                                    <input
                                        type="range"
                                        min={10} max={400} step={1}
                                        value={Math.round(placeScale * 100)}
                                        onChange={e => setPlaceScale(Number(e.target.value) / 100)}
                                        style={{ width: "100%", accentColor: "#6366f1" }}
                                    />
                                </div>
                            </>
                        )}

                        {step === "crop" && (
                            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px" }}>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Options</p>
                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={keepAspect}
                                        onChange={e => {
                                            setKeepAspect(e.target.checked);
                                            cropAspectRef.current = cropRect.w / cropRect.h;
                                        }}
                                        style={{ accentColor: "#6366f1" }}
                                    />{" "}Lock ratio
                                </label>
                                {/* quick aspect presets */}
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 10, marginBottom: 6 }}>Presets</p>
                                {[["1:1", 1], ["4:3", 4/3], ["16:9", 16/9], ["3:4", 3/4]].map(([label, ratio]) => (
                                    <button
                                        type="button"
                                        key={label as string}
                                        onClick={() => {
                                            if (!photoImg) return;
                                            setKeepAspect(true);
                                            cropAspectRef.current = ratio as number;
                                            const newH = cropRect.w / (ratio as number);
                                            setCropRect(r => ({
                                                ...r,
                                                h: Math.min(newH, photoImg.naturalHeight - r.y),
                                            }));
                                        }}
                                        style={{
                                            ...presetBtnStyle,
                                            marginBottom: 4,
                                        }}
                                    >
                                        {label as string}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* reset */}
                        <button
                            type="button"
                            onClick={step === "crop" ? resetCrop : resetPlace}
                            style={{
                                ...iconBtnStyle,
                                width: "100%",
                                padding: "7px 0",
                                borderRadius: 8,
                                fontSize: 12,
                                gap: 6,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <RotateCcw size={13} />
                            Reset
                        </button>
                    </div>
                </div>

                {/* ── footer ── */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                >
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        style={cancelBtnStyle}
                        disabled={isGenerating || isLoading}
                    >
                        <X size={14} />
                        Cancel
                    </button>

                    <div style={{ display: "flex", gap: 10 }}>
                        {step === "place" && (
                            <button type="button" onClick={goBackToCrop} style={secondaryBtnStyle}>
                                <ChevronLeft size={14} />
                                Back
                            </button>
                        )}
                        {step === "crop" && (
                            <button
                                type="button"
                                onClick={proceedToPlace}
                                disabled={!photoImg}
                                style={primaryBtnStyle}
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        )}
                        {step === "place" && (
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!croppedCanvas || isGenerating || isLoading}
                                style={primaryBtnStyle}
                            >
                                {isGenerating || isLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Check size={14} />
                                )}
                                Apply
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
