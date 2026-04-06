"use client";

import { useEffect, useRef, useState } from "react";
import {
  generateBrandColorShades,
  hexToRgb,
  type BrandColors,
  type BrandColorShades,
} from "@/utils/theme";

/**
 * Fetches tenant brand colors and generates shades.
 * Tracks all applied CSS custom properties and removes them on cleanup
 * so that the CSS-defined defaults in custom.css take over.
 */
export function useBrandColors(initialColors?: BrandColors) {
  const [brandColors, setBrandColors] = useState<BrandColors | null>(initialColors || null);
  const [colorShades, setColorShades] = useState<BrandColorShades | null>(
    initialColors ? generateBrandColorShades(initialColors) : null
  );
  const [isLoading, setIsLoading] = useState(!initialColors);
  const [error, setError] = useState<string | null>(null);

  // Track every CSS property we set so cleanup is always complete
  const appliedPropsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!brandColors || typeof document === "undefined") return;

    const root = document.documentElement;
    const applied = appliedPropsRef.current;

    // Helper: set a CSS property and track it
    function set(prop: string, value: string) {
      root.style.setProperty(prop, value);
      applied.add(prop);
    }

    const shades = generateBrandColorShades(brandColors);
    setColorShades(shades);

    // 1. Semantic names
    set("--primary", brandColors.primary);
    set("--secondary", brandColors.secondary);
    set("--tertiary", brandColors.tertiary);
    set("--color-primary", brandColors.primary);
    set("--color-secondary", brandColors.secondary);
    set("--color-tertiary", brandColors.tertiary);

    // 2. All generated shades
    Object.entries(shades).forEach(([colorName, shadeMap]) => {
      Object.entries(shadeMap).forEach(([shade, value]) => {
        const colorValue = value as string;
        const rgbValue = hexToRgb(colorValue);

        set(`--brand-${colorName}-${shade}`, colorValue);
        set(`--color-${colorName}-${shade}`, colorValue);
        set(`--${colorName}-${shade}`, colorValue);

        if (shade === "500") {
          set(`--${colorName}`, colorValue);
          set(`--color-${colorName}`, colorValue);
        }

        if (rgbValue) {
          set(`--${colorName}-${shade}-rgb`, `${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}`);
          set(`--color-${colorName}-${shade}-rgb`, `${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}`);
        }
      });
    });

    // Cleanup: remove every property we applied so CSS defaults take over
    return () => {
      if (typeof document === "undefined") return;
      const root = document.documentElement;
      for (const prop of applied) {
        root.style.removeProperty(prop);
      }
      applied.clear();
    };
  }, [brandColors]);

  // Sync external initialColors changes into local state
  useEffect(() => {
    if (!initialColors) {
      setBrandColors(null);
      return;
    }
    setBrandColors(prev => {
      if (prev &&
        prev.primary === initialColors.primary &&
        prev.secondary === initialColors.secondary &&
        prev.tertiary === initialColors.tertiary) {
        return prev;
      }
      return initialColors;
    });
  }, [initialColors]);

  const refreshColors = async () => {
    if (initialColors) {
      setBrandColors(initialColors);
    }
  };

  return {
    brandColors,
    colorShades,
    isLoading,
    error,
    refreshColors,
  };
}

