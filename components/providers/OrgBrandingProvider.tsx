"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface OrgBranding {
    logoUrl: string | null;
    name: string | null;
}

interface OrgBrandingContextType {
    branding: OrgBranding;
    setBranding: (branding: OrgBranding) => void;
}

const OrgBrandingContext = createContext<OrgBrandingContextType | undefined>(undefined);

export function OrgBrandingProvider({ children }: { children: React.ReactNode }) {
    const [branding, setBranding] = useState<OrgBranding>({ logoUrl: null, name: null });

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
