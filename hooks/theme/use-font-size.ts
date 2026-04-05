"use client";

import {useEffect, useState} from "react";

export type FontSizeOption = "small" | "medium" | "large";

const fontSizeMap = {
    small: 14,
    medium: 16,
    large: 20,
} as const;

/**
 * Custom hook for managing font size preference
 * Stores the preference in sessionStorage and applies it to the root element
 */
export const useFontSize = () => {
    // Initialize from sessionStorage or default to 'medium'
    const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem("font-size");
            if (stored === "small" || stored === "medium" || stored === "large") {
                return stored;
            }
        }
        return "medium";
    });

    // Validate font size
    const validatedSize: FontSizeOption =
        fontSize === "small" || fontSize === "medium" || fontSize === "large"
            ? fontSize
            : "medium";

    const fontSizeInPx = fontSizeMap[validatedSize];

    /**
     * Set font size and persist to sessionStorage
     */
    const setFontSize = (size: FontSizeOption) => {
        setFontSizeState(size);
        if (typeof window !== "undefined") {
            sessionStorage.setItem("font-size", size);
        }
    };

    // Apply font size on mount and when it changes
    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.style.fontSize = `${fontSizeMap[validatedSize]}px`;
        }
    }, [validatedSize]);

    return {
        fontSize: validatedSize,
        fontSizeInPx,
        setFontSize,
    };
};
