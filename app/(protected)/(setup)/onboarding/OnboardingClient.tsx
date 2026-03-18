"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Step1Welcome,
    Step2Avatar,
    Step3Referral,
} from "@/components/onboarding";
import {
    OrgStep1BasicInfo,
    OrgStep2Branding,
    OrgStep3Customize,
    OrgCreationComplete,
} from "@/components/organization";
import { createNewOrganization } from "@/lib/actions/organization";

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

interface OnboardingClientProps {
    readonly initialStep: number;
}

export function OnboardingClient({
    initialStep,
}: OnboardingClientProps) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [currentStep, setCurrentStep] = useState(initialStep);

    // Org creation state
    const [orgFormData, setOrgFormData] = useState<Partial<OrgFormData>>({});
    const [createdOrg, setCreatedOrg] = useState<{
        id: string;
        name: string;
        slug: string;
        logoUrl?: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // --- Onboarding step handlers ---
    function handleStep1Success() {
        setCurrentStep(1);
        router.refresh();
    }

    function handleStep2Success() {
        setCurrentStep(2);
        router.refresh();
    }

    function handleStep2Skip() {
        setCurrentStep(2);
        router.refresh();
    }

    function handleStep3Success() {
        setCurrentStep(3);
    }

    function handleStep3Skip() {
        setCurrentStep(3);
    }

    // --- Org creation step handlers ---
    function handleOrgStep1Success(data: { name: string; slug: string }) {
        setOrgFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep(4);
    }

    function handleOrgStep2Success(data: { logoUrl?: string; description?: string }) {
        setOrgFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep(5);
    }

    function handleOrgStep2Skip() {
        createOrganization(orgFormData as OrgFormData, { redirectToDashboard: true });
    }

    function handleOrgStep3Success(data: {
        contactEmail?: string;
        websiteUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
    }) {
        const finalData = { ...orgFormData, ...data };
        setOrgFormData(finalData);
        createOrganization(finalData as OrgFormData);
    }

    function handleOrgStep3Skip() {
        createOrganization(orgFormData as OrgFormData);
    }

    async function createOrganization(
        data: OrgFormData,
        options?: { redirectToDashboard?: boolean }
    ) {
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
                if (options?.redirectToDashboard) {
                    router.replace("/dashboard");
                    return;
                }

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

    if (createdOrg) {
        return <OrgCreationComplete organization={createdOrg} />;
    }

    return (
        <>
            {/* Onboarding Steps */}
            {currentStep === 0 && (
                <Step1Welcome onSuccess={handleStep1Success} />
            )}

            {currentStep === 1 && (
                <Step2Avatar
                    onSuccess={handleStep2Success}
                    onSkip={handleStep2Skip}
                />
            )}

            {currentStep === 2 && (
                <Step3Referral
                    onSuccess={handleStep3Success}
                    onSkip={handleStep3Skip}
                />
            )}

            {/* Org Creation Steps */}
            {currentStep === 3 && (
                <OrgStep1BasicInfo
                    defaultValues={{
                        name: orgFormData.name,
                        slug: orgFormData.slug,
                    }}
                    onSuccess={handleOrgStep1Success}
                    isInitialSetup={true}
                />
            )}

            {currentStep === 4 && (
                <OrgStep2Branding
                    defaultValues={{
                        logoUrl: orgFormData.logoUrl,
                        description: orgFormData.description,
                    }}
                    orgName={orgFormData.name ?? "Organization"}
                    onSuccess={handleOrgStep2Success}
                    onSkip={handleOrgStep2Skip}
                />
            )}

            {currentStep === 5 && (
                <OrgStep3Customize
                    defaultValues={{
                        contactEmail: orgFormData.contactEmail,
                        websiteUrl: orgFormData.websiteUrl,
                        primaryColor: orgFormData.primaryColor,
                        secondaryColor: orgFormData.secondaryColor,
                    }}
                    onSuccess={handleOrgStep3Success}
                    onSkip={handleOrgStep3Skip}
                />
            )}

            {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                    {error}
                </div>
            )}
        </>
    );
}