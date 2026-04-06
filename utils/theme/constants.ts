import type { BrandColors } from "./color-generator";

export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: "#02a605ff",
  secondary: "#ffe100ff",
  tertiary: "#dc2626",
};

/**
 * Predefined set of brand-safe color combinations (Tailwind colors)
 * Users can only choose from these to ensure professional looks
 */
export const PRESET_COLORS = [
  { name: "Sankofa Red", value: "#dc2626" },
  { name: "Sankofa Gold", value: "#ffe100ff" },
  { name: "Sankofa Green", value: "#02a605ff" },
  { name: "Sankofa Forest", value: "#009A44" },
  { name: "Stripe Blue", value: "#6366f1" },
  { name: "Royal Blue", value: "#2563eb" },
  { name: "Deep Purple", value: "#7c3aed" },
  { name: "Spotify Green", value: "#1db954" },
  { name: "Mint Emerald", value: "#10b981" },
  { name: "Goldenrod", value: "#f59e0b" },
  { name: "Sunset Orange", value: "#f97316" },
  { name: "Deep Rose", value: "#e11d48" },
];

