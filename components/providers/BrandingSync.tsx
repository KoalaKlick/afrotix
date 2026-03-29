"use client";

import { useEffect } from "react";
import { useOrgBranding } from "@/components/providers/OrgBrandingProvider";

interface BrandingSyncProps {
    logoUrl: string | null;
    name: string | null;
}

export function BrandingSync({ logoUrl, name }: BrandingSyncProps) {
    const { setBranding } = useOrgBranding();

    useEffect(() => {
        setBranding({ logoUrl, name });
        
        // Cleanup when leaving the organization context
        return () => {
            setBranding({ logoUrl: null, name: null });
        };
    }, [logoUrl, name, setBranding]);

    return null;
}
