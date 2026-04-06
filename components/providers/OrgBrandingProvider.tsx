"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface OrgBranding {
    logoUrl: string | null;
    name: string | null;
    /** Whether the global site header should be visible. Defaults to true.
     *  Set to false for org slug pages; future premium feature can override. */
    showHeader: boolean;
}

interface OrgBrandingContextType {
    branding: OrgBranding;
    setBranding: (branding: OrgBranding) => void;
}

const OrgBrandingContext = createContext<OrgBrandingContextType | undefined>(undefined);

export function OrgBrandingProvider({ children }: { children: React.ReactNode }) {
    const [branding, setBranding] = useState<OrgBranding>({ logoUrl: null, name: null, showHeader: true });

    return (
        <OrgBrandingContext.Provider value={{ branding, setBranding }}>
            {children}
        </OrgBrandingContext.Provider>
    );
}

export function useOrgBranding() {
    const context = useContext(OrgBrandingContext);
    if (context === undefined) {
        throw new Error("useOrgBranding must be used within an OrgBrandingProvider");
    }
    return context;
}
