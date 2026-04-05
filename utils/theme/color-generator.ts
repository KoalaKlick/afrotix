/**
 * OKLCH-based color shade generator
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert HEX color to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Handle 8-digit hex (RRGGBBAA) - discard alpha for basic RGB
  if (hex.length === 8) {
    hex = hex.slice(0, 6);
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

/**
 * Convert RGB to HEX
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to hex color string
 */
export function rgbToHexString(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Convert hex to RGB string format (for CSS variables)
 */
export function hexToRgbString(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/**
 * Generates a CSS rgba string from hex and alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "rgba(0, 0, 0, 0)";
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * OKLab / OKLCH conversions
 * Implementation based on the Oklab spec.
 */

function srgbToLinear(c: number) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function rgbToOklab(rgb: RGB) {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  // Linear RGB to LMS
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  return { L, a, b: b_ };
}

function oklabToRgb(ok: { L: number; a: number; b: number }): RGB {
  const l_ = ok.L + 0.3963377774 * ok.a + 0.2158037573 * ok.b;
  const m_ = ok.L - 0.1055613458 * ok.a - 0.0638541728 * ok.b;
  const s_ = ok.L - 0.0894841775 * ok.a - 1.2914855480 * ok.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return {
    r: Math.max(0, Math.min(255, Math.round(linearToSrgb(r) * 255))),
    g: Math.max(0, Math.min(255, Math.round(linearToSrgb(g) * 255))),
    b: Math.max(0, Math.min(255, Math.round(linearToSrgb(b) * 255))),
  };
}

function oklabToOklch(ok: { L: number; a: number; b: number }) {
  const c = Math.sqrt(ok.a * ok.a + ok.b * ok.b);
  const h = Math.atan2(ok.b, ok.a) * (180 / Math.PI);
  return { L: ok.L, C: c, h: (h < 0 ? h + 360 : h) };
}

function oklchToOklab(lch: { L: number; C: number; h: number }) {
  const hRad = (lch.h * Math.PI) / 180;
  return { L: lch.L, a: lch.C * Math.cos(hRad), b: lch.C * Math.sin(hRad) };
}

export function hexToOklch(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const lab = rgbToOklab(rgb);
  return oklabToOklch(lab);
}

export function oklchToHex(lch: { L: number; C: number; h: number }) {
  const lab = oklchToOklab(lch);
  const rgb = oklabToRgb(lab);
  return rgbToHex(rgb);
}

/**
 * Format OKLCH as CSS string
 */
export function oklchToCss(lch: { L: number; C: number; h: number }): string {
  return `oklch(${lch.L.toFixed(3)} ${lch.C.toFixed(3)} ${lch.h.toFixed(3)})`;
}

/**
 * Generate color shades from a base color
 * Generates 11 shades from 50 (lightest) to 950 (darkest)
 * The base color is typically mapped to shade 500
 */
export function generateColorShades(baseColor: string): Record<number, string> {
  const lch = hexToOklch(baseColor);
  if (!lch) {
    console.error(`Invalid color: ${baseColor}`);
    return {};
  }

  const baseL = lch.L; // 0..1
  const baseC = lch.C;
  const baseH = lch.h;

  // Define offsets for each shade relative to base L (500)
  // positive offsets => lighter, negative => darker
  const offsets: Record<number, number> = {
    50: 0.45,
    100: 0.4,
    200: 0.3,
    300: 0.18,
    400: 0.08,
    500: 0,
    600: -0.12,
    700: -0.18,
    800: -0.28,
    900: -0.36,
    950: -0.44,
  };

  const shades: Record<number, string> = {};

  const clamp = (v: number, a = 0.02, b = 0.98) => Math.max(a, Math.min(b, v));

  Object.entries(offsets).forEach(([shadeStr, offset]) => {
    const shade = parseInt(shadeStr, 10);

    // target lightness anchored to baseL
    let L = clamp(baseL + offset);

    // Reduce chroma for very light shades to avoid oversaturation
    let C = baseC;
    if (offset > 0) {
      const reduction = Math.min(0.8, offset / 0.6);
      C = Math.max(0.01, baseC * (1 - reduction * 0.6));
    } else if (offset < 0) {
      // Slightly increase chroma for mid-dark shades, cap it
      C = Math.min(baseC * 1.1, baseC + Math.abs(offset) * 0.05);
    }

    // Ensure 500 is exactly the base color
    if (shade === 500) {
      shades[shade] = baseColor;
      return;
    }

    shades[shade] = oklchToHex({ L, C, h: baseH });
  });

  return shades;
}

/**
 * Generate all brand color shades from base colors
 */
export interface BrandColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface BrandColorShades {
  primary: Record<number, string>;
  secondary: Record<number, string>;
  tertiary: Record<number, string>;
}

export function generateBrandColorShades(
  colors: BrandColors
): BrandColorShades {
  // Validate and filter out invalid colors before generating shades
  const safeColors: BrandColors = {
    primary: isValidHexColor(colors.primary) ? colors.primary : "#02a605ff",
    secondary: isValidHexColor(colors.secondary) ? colors.secondary : "#ffe100ff",
    tertiary: isValidHexColor(colors.tertiary) ? colors.tertiary : "#dc2626",
  };

  return {
    primary: generateColorShades(safeColors.primary),
    secondary: generateColorShades(safeColors.secondary),
    tertiary: generateColorShades(safeColors.tertiary),
  };
}

/**
 * Validate if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

