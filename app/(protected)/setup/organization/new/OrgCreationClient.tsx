"use client";

import { useState, useTransition } from "react";
import {
    OrgStep1BasicInfo,
    OrgStep2Branding,
} from "@/components/organization";
import { createNewOrganization } from "@/lib/actions/organization";
import { Loader2 } from "lucide-react";

// Form state type
type OrgFormData = {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
};

interface OrgCreationClientProps {
    readonly isInitialSetup?: boolean;
}

export function OrgCreationClient({ isInitialSetup = false }: OrgCreationClientProps) {
    const [, startTransition] = useTransition();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<OrgFormData>>({});
    const [error, setError] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Step 1 success - save name & slug, move to step 2
    function handleStep1Success(data: { name: string; slug: string }) {
        setFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep(1);
    }

    // Step 2 success - save logo & description, create org
    function handleStep2Success(data: { logoUrl?: string; description?: string }) {
        const finalData = { ...formData, ...data };
        setFormData(finalData);
        createOrganization(finalData as OrgFormData);
    }

    function handleStep2Skip() {
        createOrganization(formData as OrgFormData);
    }

    // Create the organization
    async function createOrganization(data: OrgFormData) {
        startTransition(async () => {
            const formDataObj = new FormData();
            formDataObj.set("name", data.name);
            formDataObj.set("slug", data.slug);
            if (data.description) formDataObj.set("description", data.description);
            if (data.logoUrl) formDataObj.set("logoUrl", data.logoUrl);

            const result = await createNewOrganization(formDataObj);

            if (result.success && result.data) {
                setIsRedirecting(true);
                globalThis.location.href = "/dashboard";
            } else {
                setError(result.error ?? "Failed to create organization");
            }
        });
    }

    if (isRedirecting) {
        return (
            <div className="w-full max-w-md mx-auto px-4">
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Setting up your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto px-4">
            {currentStep === 0 && (
                <OrgStep1BasicInfo
                    defaultValues={{
                        name: formData.name,
                        slug: formData.slug,
                    }}
                    onSuccess={handleStep1Success}
                    isInitialSetup={isInitialSetup}
                />
            )}

            {currentStep === 1 && (
                <OrgStep2Branding
                    defaultValues={{
                        logoUrl: formData.logoUrl,
                        description: formData.description,
                    }}
                    orgName={formData.name ?? "Organization"}
                    onSuccess={handleStep2Success}
                    onSkip={handleStep2Skip}
                />
            )}

            {/* Error display */}
            {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                    {error}
                </div>
            )}
        </div>
    );
}
