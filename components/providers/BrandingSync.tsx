"use client";

import { useEffect, useMemo } from "react";
import { useOrgBranding } from "@/components/providers/OrgBrandingProvider";
import { useBrandColors } from "@/hooks/theme/use-brand-colors";

interface BrandingSyncProps {
    logoUrl: string | null;
    name: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    tertiaryColor?: string;
}

export function BrandingSync({ logoUrl, name, primaryColor, secondaryColor, tertiaryColor }: BrandingSyncProps) {
    const { setBranding } = useOrgBranding();
    
    const brandColors = useMemo(() => (
        primaryColor && secondaryColor && tertiaryColor ? {
            primary: primaryColor,
            secondary: secondaryColor,
            tertiary: tertiaryColor
        } : undefined
    ), [primaryColor, secondaryColor, tertiaryColor]);

    // Apply organization brand colors as CSS variables
    useBrandColors(brandColors);

    useEffect(() => {
        setBranding({ logoUrl, name });
        
        // Cleanup when leaving the organization context
        return () => {
            setBranding({ logoUrl: null, name: null });
        };
    }, [logoUrl, name, setBranding]);

    return null;
}
