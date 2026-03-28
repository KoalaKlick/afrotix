"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Step1Welcome,
    Step2Avatar,
    Step3Referral,
    Step4Pricing,
} from "@/components/onboarding";
import {
    OrgStep1BasicInfo,
    OrgStep2Branding,
} from "@/components/organization";
import { createNewOrganization } from "@/lib/actions/organization";
import Image from "next/image";
import { PROJ_NAME } from "@/lib/const/branding";

type OrgFormData = {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
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
    const [error, setError] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

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
 
    function handleStep4Success() {
        setCurrentStep(4);
    }

    // --- Org creation step handlers ---
    function handleOrgStep1Success(data: { name: string; slug: string }) {
        setOrgFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep(5);
    }

    function handleOrgStep2Success(data: { logoUrl?: string; description?: string }) {
        const finalData = { ...orgFormData, ...data };
        setOrgFormData(finalData);
        createOrganization(finalData as OrgFormData);
    }

    function handleOrgStep2Skip() {
        createOrganization(orgFormData as OrgFormData);
    }

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
                router.push("/dashboard");
            } else {
                setError(result.error ?? "Failed to create organization");
            }
        });
    }

    if (isRedirecting) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 py-20">
                <Image src="/logo.svg" alt={PROJ_NAME} width={120} height={40} className="h-10 w-auto animate-pulse" priority />
                <p className="text-sm text-muted-foreground animate-pulse">Setting up your dashboard...</p>
            </div>
        );
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

            {/* Pricing Step */}
            {currentStep === 3 && (
                <Step4Pricing
                    onSuccess={handleStep4Success}
                />
            )}
 
            {/* Org Creation Steps */}
            {currentStep === 4 && (
                <OrgStep1BasicInfo
                    defaultValues={{
                        name: orgFormData.name,
                        slug: orgFormData.slug,
                    }}
                    onSuccess={handleOrgStep1Success}
                    isInitialSetup={true}
                />
            )}
 
            {currentStep === 5 && (
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

            {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                    {error}
                </div>
            )}
        </>
    );
}