/**
 * Additional color utility helpers
 */

import {hexToRgb, rgbToHexString, type BrandColors, isValidHexColor} from "./color-generator";
import {DEFAULT_BRAND_COLORS} from "./constants";

/**
 * Type definition for the color palette
 */
export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  contrastText: string;
  primary50?: string;
  primary100?: string;
  primary200?: string;
  primary300?: string;
  primary400?: string;
  primary500?: string;
  primary600?: string;
  primary700?: string;
  primary800?: string;
  primary900?: string;
  [key: string]: string | undefined;
}

/**
 * Generates lighter/darker variants of a hex color
 * @param hex The base hex color
 * @param percent Positive for lighter, negative for darker
 */
export function adjustColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;

  const amount = Math.floor(percent * 2.55);

  const newR = Math.max(0, Math.min(255, r + amount));
  const newG = Math.max(0, Math.min(255, g + amount));
  const newB = Math.max(0, Math.min(255, b + amount));

  return rgbToHexString(newR, newG, newB);
}

/**
 * Determines if a color is light or dark
 * Returns true if the color is light
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;

  // Calculate brightness (YIQ formula)
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  // If brightness > 128, color is light
  return brightness > 128;
}

/**
 * Gets appropriate text color (black or white) based on background color
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? "#000000" : "#FFFFFF";
}

/**
 * Generates a full color palette from a primary color
 */
export function generateColorPalette(primaryColor: string): ColorPalette {
  const palette: ColorPalette = {
    primary: primaryColor,
    primaryLight: adjustColor(primaryColor, 20),
    primaryDark: adjustColor(primaryColor, -20),
    contrastText: getContrastTextColor(primaryColor),
  };

  // Generate opacity variants
  const rgb = hexToRgb(primaryColor);
  if (rgb) {
    const { r, g, b } = rgb;
    palette.primary50 = `rgba(${r}, ${g}, ${b}, 0.05)`;
    palette.primary100 = `rgba(${r}, ${g}, ${b}, 0.1)`;
    palette.primary200 = `rgba(${r}, ${g}, ${b}, 0.2)`;
    palette.primary300 = `rgba(${r}, ${g}, ${b}, 0.3)`;
    palette.primary400 = `rgba(${r}, ${g}, ${b}, 0.4)`;
    palette.primary500 = `rgba(${r}, ${g}, ${b}, 0.5)`;
    palette.primary600 = `rgba(${r}, ${g}, ${b}, 0.6)`;
    palette.primary700 = `rgba(${r}, ${g}, ${b}, 0.7)`;
    palette.primary800 = `rgba(${r}, ${g}, ${b}, 0.8)`;
    palette.primary900 = `rgba(${r}, ${g}, ${b}, 0.9)`;
  }

  return palette;
}

/**
 * Extract brand colors from a database object (e.g. Organization)
 * @param source - Object containing color strings
 * @returns BrandColors object with validated colors
 */
export function extractBrandColors(source?: any): BrandColors {
  if (!source || typeof source !== "object") {
    return DEFAULT_BRAND_COLORS;
  }

  return {
    primary: source.primaryColor || source.primary || DEFAULT_BRAND_COLORS.primary,
    secondary: source.secondaryColor || source.secondary || DEFAULT_BRAND_COLORS.secondary,
    tertiary: source.tertiaryColor || source.tertiary || DEFAULT_BRAND_COLORS.tertiary,
  };
}

/**
 * Validate brand colors and provide fallbacks for invalid colors
 * @param colors - BrandColors to validate
 * @returns Validated BrandColors with fallbacks for invalid values
 */
export function validateBrandColors(colors: BrandColors): BrandColors {
  return {
    primary: isValidHexColor(colors.primary) ? colors.primary : DEFAULT_BRAND_COLORS.primary,
    secondary: isValidHexColor(colors.secondary) ? colors.secondary : DEFAULT_BRAND_COLORS.secondary,
    tertiary: isValidHexColor(colors.tertiary) ? colors.tertiary : DEFAULT_BRAND_COLORS.tertiary,
  };
}

