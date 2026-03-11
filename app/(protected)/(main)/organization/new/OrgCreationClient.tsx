"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    OrgCreationProgress,
    OrgStep1BasicInfo,
    OrgStep2Branding,
    OrgStep3Customize,
    OrgCreationComplete,
} from "@/components/organization";
import { createNewOrganization } from "@/lib/actions/organization";
import { TOTAL_ORG_CREATION_STEPS } from "@/lib/validations/organization";

// Form state type
type OrgFormData = {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    contactEmail?: string;
    websiteUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
};

interface OrgCreationClientProps {
    readonly isInitialSetup?: boolean;
}

export function OrgCreationClient({ isInitialSetup = false }: OrgCreationClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<OrgFormData>>({});
    const [createdOrg, setCreatedOrg] = useState<{
        id: string;
        name: string;
        slug: string;
        logoUrl?: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Step 1 success - save name & slug, move to step 2
    function handleStep1Success(data: { name: string; slug: string }) {
        setFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep(1);
    }

    // Step 2 success - save logo & description, move to step 3
    function handleStep2Success(data: { logoUrl?: string; description?: string }) {
        setFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep(2);
    }

    function handleStep2Skip() {
        setCurrentStep(2);
    }

    // Step 3 success - create organization
    function handleStep3Success(data: {
        contactEmail?: string;
        websiteUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
    }) {
        const finalData = { ...formData, ...data };
        setFormData(finalData);
        createOrganization(finalData as OrgFormData);
    }

    function handleStep3Skip() {
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
            if (data.contactEmail) formDataObj.set("contactEmail", data.contactEmail);
            if (data.websiteUrl) formDataObj.set("websiteUrl", data.websiteUrl);
            if (data.primaryColor) formDataObj.set("primaryColor", data.primaryColor);
            if (data.secondaryColor) formDataObj.set("secondaryColor", data.secondaryColor);

            const result = await createNewOrganization(formDataObj);

            if (result.success && result.data) {
                setCreatedOrg({
                    id: result.data.id,
                    name: data.name,
                    slug: result.data.slug,
                    logoUrl: data.logoUrl,
                });
            } else {
                setError(result.error ?? "Failed to create organization");
            }
        });
    }

    // Show completion screen
    if (createdOrg) {
        return (
            <div className="w-full max-w-md mx-auto px-4">
                <OrgCreationComplete organization={createdOrg} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto px-4">
            {/* Progress Indicator */}
            <div className="mb-6">
                <OrgCreationProgress currentStep={currentStep} />
            </div>

            {/* Step Components */}
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

            {currentStep === 2 && (
                <OrgStep3Customize
                    defaultValues={{
                        contactEmail: formData.contactEmail,
                        websiteUrl: formData.websiteUrl,
                        primaryColor: formData.primaryColor,
                        secondaryColor: formData.secondaryColor,
                    }}
                    onSuccess={handleStep3Success}
                    onSkip={handleStep3Skip}
                />
            )}

            {/* Error display */}
            {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                    {error}
                </div>
            )}

            {/* Step indicator text */}
            <p className="mt-4 text-center text-sm text-muted-foreground">
                Step {currentStep + 1} of {TOTAL_ORG_CREATION_STEPS}
            </p>
        </div>
    );
}
