"use client";

import {useTheme} from "next-themes";
import {useEffect, useState} from "react";

export type ThemeMode = "light" | "dark" | "system";

/**
 * Enhanced hook for managing theme mode with next-themes
 * Provides light/dark/system theme options with smooth transitions
 */
export const useThemeMode = () => {
    const { theme, setTheme: setNextTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    /**
     * Get the current theme mode (light/dark/system)
     */
    const themeMode = (theme as ThemeMode) || "system";

    /**
     * Get the actual applied theme (resolves 'system' to 'light' or 'dark')
     */
    const actualTheme = resolvedTheme as "light" | "dark" | undefined;

    /**
     * Set theme mode with smooth transition
     */
    const setThemeMode = (mode: ThemeMode) => {
        if (typeof document !== "undefined") {
            const root = document.documentElement;

            // Add transition class before toggling
            root.classList.add("theme-transition");

            // Set the theme
            setNextTheme(mode);

            // Remove transition class after animation completes
            setTimeout(() => {
                root.classList.remove("theme-transition");
            }, 300);
        } else {
            setNextTheme(mode);
        }
    };

    /**
     * Check if dark mode is active
     */
    const isDark = actualTheme === "dark";

    return {
        themeMode,
        actualTheme,
        setThemeMode,
        isDark,
        mounted, // Useful to avoid hydration mismatches
    };
};
