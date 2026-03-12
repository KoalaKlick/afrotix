"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import {
    Building2,
    Globe,
    Loader2,
    Check,
    X,
    Sparkles,
    ImagePlus,
    Palette,
    Mail,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetBody,
    SheetFooter,
} from "@/components/ui/sheet";
import { validateOrgStep1, createNewOrganization, uploadOrgLogo } from "@/lib/actions/organization";
import { generateSlug } from "@/lib/validations/organization";
import { useDebounce } from "@/hooks/use-debounce";
import { convertToWebP } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

interface CreateOrgDrawerProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
    { name: "Purple", value: "#6366f1" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Red", value: "#ef4444" },
    { name: "Yellow", value: "#eab308" },
    { name: "Teal", value: "#14b8a6" },
];

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function CreateOrgDrawer({ open, onOpenChange }: CreateOrgDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentStep, setCurrentStep] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step 1: Basic Info
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
    const [slugStatus, setSlugStatus] = useState<
        "idle" | "checking" | "available" | "taken" | "invalid"
    >("idle");

    // Step 2: Branding
    const [logoUrl, setLogoUrl] = useState("");
    const [description, setDescription] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Step 3: Customize
    const [primaryColor, setPrimaryColor] = useState("#6366f1");
    const [contactEmail, setContactEmail] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");

    const debouncedSlug = useDebounce(slug, 500);

    // Reset form when drawer closes
    useEffect(() => {
        if (!open) {
            setCurrentStep(1);
            setName("");
            setSlug("");
            setIsSlugManuallyEdited(false);
            setSlugStatus("idle");
            setLogoUrl("");
            setDescription("");
            setPrimaryColor("#6366f1");
            setContactEmail("");
            setWebsiteUrl("");
            setErrors({});
        }
    }, [open]);

    // Auto-generate slug from name
    useEffect(() => {
        if (!isSlugManuallyEdited && name) {
            setSlug(generateSlug(name));
        }
    }, [name, isSlugManuallyEdited]);

    // Check slug availability when it changes
    useEffect(() => {
        if (!debouncedSlug || debouncedSlug.length < 2) {
            setSlugStatus("idle");
            return;
        }

        setSlugStatus("checking");

        const formData = new FormData();
        formData.set("name", name);
        formData.set("slug", debouncedSlug);

        validateOrgStep1(formData).then((result) => {
            if (result.success) {
                setSlugStatus("available");
                setErrors((prev) => {
                    const { slug: _, ...rest } = prev;
                    return rest;
                });
            } else if (result.error?.includes("URL")) {
                setSlugStatus("taken");
                setErrors((prev) => ({ ...prev, slug: result.error ?? "URL taken" }));
            } else {
                setSlugStatus("invalid");
                setErrors((prev) => ({ ...prev, slug: result.error ?? "Invalid" }));
            }
        });
    }, [debouncedSlug, name]);

    function handleSlugChange(value: string) {
        setSlug(value.toLowerCase().replaceAll(/[^a-z0-9-]/g, ""));
        setIsSlugManuallyEdited(true);
    }
  
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setErrors({ logo: "Please select an image file" });
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setErrors({ logo: "Image must be less than 5MB" });
            return;
        }

        setIsUploading(true);
        setErrors((prev) => {
            const { logo: _, ...rest } = prev;
            return rest;
        });

        try {
            // Convert to WebP for optimization
            const optimizedFile = await convertToWebP(file, {
                quality: 0.85,
                maxWidth: 400,
                maxHeight: 400,
                maxSizeMB: 0.5,
            });

            const formData = new FormData();
            formData.set("file", optimizedFile);

            const result = await uploadOrgLogo(formData);

            if (result.success && result.data) {
                setLogoUrl(result.data.url);
            } else {
                setErrors({ logo: result.error ?? "Upload failed" });
            }
        } catch (error) {
            console.error("Logo upload error:", error);
            setErrors({ logo: "Failed to upload logo" });
        } finally {
            setIsUploading(false);
        }
    }

    function handleRemoveLogo() {
        setLogoUrl("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function handleNextStep() {
        if (currentStep === 1) {
            if (!name.trim()) {
                setErrors({ name: "Organization name is required" });
                return;
            }
            if (slugStatus === "taken" || slugStatus === "invalid") {
                return;
            }
            if (slugStatus === "checking") {
                return;
            }
        }
        if (currentStep === 2) {
            // Step 2 is optional, no validation needed
        }
        setErrors({});
        setCurrentStep((prev) => Math.min(prev + 1, 3));
    }

    function handlePrevStep() {
        setErrors({});
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    }

    async function handleSubmit(e: { preventDefault: () => void }) {
        e.preventDefault();

        // Validate contact email if provided
        if (contactEmail && !contactEmail.includes("@")) {
            setErrors({ contactEmail: "Please enter a valid email" });
            return;
        }

        // Validate URL if provided
        if (websiteUrl && !/^https?:\/\/.+/.exec(websiteUrl)) {
            setErrors({ websiteUrl: "Please enter a valid URL starting with http:// or https://" });
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.set("name", name);
            formData.set("slug", slug);
            if (description) formData.set("description", description);
            if (logoUrl) formData.set("logoUrl", logoUrl);
            if (primaryColor) formData.set("primaryColor", primaryColor);
            if (contactEmail) formData.set("contactEmail", contactEmail);
            if (websiteUrl) formData.set("websiteUrl", websiteUrl);

            const result = await createNewOrganization(formData);

            if (result.success && result.data) {
                toast.success("Organization created successfully!");
                onOpenChange(false);
                globalThis.location.reload();
            } else {
                setErrors({ form: result.error ?? "Something went wrong" });
            }
        });
    }

    const slugIcon = () => {
        switch (slugStatus) {
            case "checking":
                return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
            case "available":
                return <Check className="h-4 w-4 text-green-500" />;
            case "taken":
            case "invalid":
                return <X className="h-4 w-4 text-destructive" />;
            default:
                return null;
        }
    };

    const steps = [
        { number: 1, label: "Basic Info", icon: Building2 },
        { number: 2, label: "Branding", icon: ImagePlus },
        { number: 3, label: "Customize", icon: Palette },
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Create Organization
                    </SheetTitle>
                    <SheetDescription>
                        Set up a new organization to start hosting events
                    </SheetDescription>
                </SheetHeader>

                {/* Step Indicator */}
                <div className="mt-4 px-4 md:px-6 flex items-center justify-between">
                    {steps.map((step, idx) => (
                        <div key={step.number} className="flex items-center">
                            <div
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                                    currentStep >= step.number
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-muted-foreground/30 text-muted-foreground"
                                )}
                            >
                                {currentStep > step.number ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    step.number
                                )}
                            </div>
                            <span
                                className={cn(
                                    "ml-2 text-xs hidden sm:inline",
                                    currentStep >= step.number
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                {step.label}
                            </span>
                            {idx < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "mx-2 h-0.5 w-8 sm:w-12",
                                        currentStep > step.number
                                            ? "bg-primary"
                                            : "bg-muted-foreground/30"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                    <SheetBody className="mt-6 space-y-6 flex-1 overflow-y-auto">
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="org-name">Organization Name *</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="org-name"
                                            placeholder="My Organization"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="pl-9"
                                            autoFocus
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        The name of your organization or brand
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="org-slug">Organization URL *</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="org-slug"
                                            placeholder="my-organization"
                                            value={slug}
                                            onChange={(e) => handleSlugChange(e.target.value)}
                                            className="pl-9 pr-9"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {slugIcon()}
                                        </div>
                                    </div>
                                    {errors.slug && (
                                        <p className="text-sm text-destructive">{errors.slug}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        afrotix.com/{slug || "your-org"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Branding */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                {/* Logo Upload */}
                                <div className="space-y-3">
                                    <Label>Organization Logo</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-20 w-20 rounded-xl">
                                                <AvatarImage src={logoUrl} alt={name} />
                                                <AvatarFallback className="rounded-xl text-lg font-semibold bg-primary/10 text-primary">
                                                    {getInitials(name || "ORG")}
                                                </AvatarFallback>
                                            </Avatar>
                                            {logoUrl && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="logo-upload"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="w-full"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImagePlus className="mr-2 h-4 w-4" />
                                                        {logoUrl ? "Change Logo" : "Upload Logo"}
                                                    </>
                                                )}
                                            </Button>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                PNG, JPG or WEBP. Max 5MB.
                                            </p>
                                        </div>
                                    </div>
                                    {errors.logo && (
                                        <p className="text-xs text-destructive">{errors.logo}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Tell people about your organization..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        A brief description of what your organization does
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Customize */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                {/* Brand Color */}
                                <div className="space-y-3">
                                    <Label>Brand Color</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Used for buttons and accents on your event pages
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setPrimaryColor(color.value)}
                                                className={cn(
                                                    "h-8 w-8 rounded-full transition-all",
                                                    primaryColor === color.value
                                                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                                                        : "hover:scale-105"
                                                )}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="h-10 w-14 p-1 cursor-pointer"
                                        />
                                        <Input
                                            type="text"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            placeholder="#6366f1"
                                            className="font-mono text-sm flex-1"
                                            maxLength={7}
                                        />
                                    </div>

                                    {/* Preview */}
                                    <div className="p-4 rounded-lg border bg-muted/50 mt-3">
                                        <p className="text-xs text-muted-foreground mb-2">Preview</p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                style={{ backgroundColor: primaryColor }}
                                                className="text-white hover:opacity-90"
                                            >
                                                Get Tickets
                                            </Button>
                                            <span
                                                className="text-sm font-medium"
                                                style={{ color: primaryColor }}
                                            >
                                                Event Title
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail">Contact Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="contactEmail"
                                            type="email"
                                            placeholder="events@example.com"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    {errors.contactEmail && (
                                        <p className="text-sm text-destructive">{errors.contactEmail}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Public email for attendee inquiries
                                    </p>
                                </div>

                                {/* Website URL */}
                                <div className="space-y-2">
                                    <Label htmlFor="websiteUrl">Website</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="websiteUrl"
                                            type="url"
                                            placeholder="https://yourbrand.com"
                                            value={websiteUrl}
                                            onChange={(e) => setWebsiteUrl(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    {errors.websiteUrl && (
                                        <p className="text-sm text-destructive">{errors.websiteUrl}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Your organization's website (optional)
                                    </p>
                                </div>
                            </div>
                        )}

                        {errors.form && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                                {errors.form}
                            </div>
                        )}
                    </SheetBody>

                    <SheetFooter className="mt-6 gap-2">
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrevStep}
                                disabled={isPending}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        )}
                        {currentStep < 3 ? (
                            <Button
                                type="button"
                                onClick={handleNextStep}
                                disabled={
                                    (currentStep === 1 &&
                                        (!name.trim() ||
                                            slugStatus === "taken" ||
                                            slugStatus === "invalid" ||
                                            slugStatus === "checking")) ||
                                    isUploading
                                }
                                className="flex-1"
                            >
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Create Organization
                                    </>
                                )}
                            </Button>
                        )}
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
