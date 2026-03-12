import type { CropRect, CropHandle } from "./types";
import { MIN_CROP } from "./constants";

export function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export function getCroppedCanvas(img: HTMLImageElement, crop: CropRect): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = crop.w;
    c.height = crop.h;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
    return c;
}

export function applyHandleDelta(
    handle: CropHandle,
    dx: number,
    dy: number,
    origin: CropRect,
    imgW: number,
    imgH: number,
    keepRatio: boolean,
    aspect: number,
): CropRect {
    let { x, y, w, h } = origin;

    if (handle === "body") {
        return {
            x: clamp(x + dx, 0, imgW - w),
            y: clamp(y + dy, 0, imgH - h),
            w,
            h,
        };
    }

    // North edge — y moves, h compensates so the south edge stays fixed
    if (handle === "n" || handle === "nw" || handle === "ne") {
        const newY = clamp(origin.y + dy, 0, origin.y + origin.h - MIN_CROP);
        y = newY;
        h = origin.y + origin.h - newY;
    }

    // South edge — y stays, h grows/shrinks downward
    if (handle === "s" || handle === "sw" || handle === "se") {
        h = clamp(origin.h + dy, MIN_CROP, imgH - origin.y);
    }

    // West edge — x moves, w compensates so the east edge stays fixed
    if (handle === "w" || handle === "nw" || handle === "sw") {
        const newX = clamp(origin.x + dx, 0, origin.x + origin.w - MIN_CROP);
        x = newX;
        w = origin.x + origin.w - newX;
    }

    // East edge — x stays, w grows/shrinks rightward
    if (handle === "e" || handle === "ne" || handle === "se") {
        w = clamp(origin.w + dx, MIN_CROP, imgW - origin.x);
    }

    if (keepRatio && h > 0) {
        w = clamp(h * aspect, MIN_CROP, imgW - x);
    }

    return {
        x,
        y,
        w: Math.max(MIN_CROP, w),
        h: Math.max(MIN_CROP, h),
    };
}