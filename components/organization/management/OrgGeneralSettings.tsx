"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Building2, Globe, Mail, Loader2, Palette, X, Image as ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateExistingOrganization, uploadOrgLogo, uploadOrgBanner } from "@/lib/actions/organization";
import { convertToWebP } from "@/lib/image-utils";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { TicketPreview } from "@/components/shared/TicketPreview";
import { cn } from "@/lib/utils";

interface OrgGeneralSettingsProps {
    readonly organization: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        logoUrl: string | null;
        bannerUrl: string | null;
        primaryColor: string;
        secondaryColor: string;
        websiteUrl: string | null;
        contactEmail: string | null;
    };
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

export function OrgGeneralSettings({ organization }: OrgGeneralSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Basic Info
    const [name, setName] = useState(organization.name);
    const [slug, setSlug] = useState(organization.slug);
    const [description, setDescription] = useState(organization.description ?? "");

    // Branding - store paths (not URLs)
    const [logoPath, setLogoPath] = useState(organization.logoUrl ?? "");
    const [bannerPath, setBannerPath] = useState(organization.bannerUrl ?? "");
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);

    // Derive display URLs from paths
    const logoDisplayUrl = logoPath ? getOrgImageUrl(logoPath) : null;
    const bannerDisplayUrl = bannerPath ? getOrgImageUrl(bannerPath) : null;

    // Colors
    const [primaryColor, setPrimaryColor] = useState(organization.primaryColor);
    const [secondaryColor, setSecondaryColor] = useState(organization.secondaryColor);

    // Contact
    const [websiteUrl, setWebsiteUrl] = useState(organization.websiteUrl ?? "");
    const [contactEmail, setContactEmail] = useState(organization.contactEmail ?? "");

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }

        setIsUploadingLogo(true);
        try {
            const optimizedFile = await convertToWebP(file, {
                quality: 0.85,
                maxWidth: 400,
                maxHeight: 400,
                maxSizeMB: 0.5,
            });

            const formData = new FormData();
            formData.set("file", optimizedFile);
            // Pass old logo path for deletion
            if (logoPath) {
                formData.set("oldLogoPath", logoPath);
            }

            const result = await uploadOrgLogo(formData);
            if (result.success && result.data) {
                setLogoPath(result.data.path);
                toast.success("Logo uploaded!");
            } else {
                toast.error(result.error ?? "Failed to upload logo");
            }
        } catch {
            toast.error("Failed to upload logo");
        } finally {
            setIsUploadingLogo(false);
        }
    }

    async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be less than 10MB");
            return;
        }

        setIsUploadingBanner(true);
        try {
            const optimizedFile = await convertToWebP(file, {
                quality: 0.85,
                maxWidth: 1920,
                maxHeight: 600,
                maxSizeMB: 1,
            });

            const formData = new FormData();
            formData.set("file", optimizedFile);
            // Pass old banner path for deletion
            if (bannerPath) {
                formData.set("oldBannerPath", bannerPath);
            }

            const result = await uploadOrgBanner(formData);
            if (result.success && result.data) {
                setBannerPath(result.data.path);
                toast.success("Banner uploaded!");
            } else {
                toast.error(result.error ?? "Failed to upload banner");
            }
        } catch {
            toast.error("Failed to upload banner");
        } finally {
            setIsUploadingBanner(false);
        }
    }

    function handleRemoveLogo() {
        setLogoPath("");
        if (logoInputRef.current) {
            logoInputRef.current.value = "";
        }
    }

    function handleRemoveBanner() {
        setBannerPath("");
        if (bannerInputRef.current) {
            bannerInputRef.current.value = "";
        }
    }

    function handleSubmit(e: { preventDefault: () => void }) {
        e.preventDefault();

        // Validate contact email if provided
        if (contactEmail && !contactEmail.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        // Validate URL if provided
        if (websiteUrl && !/^https?:\/\/.+/.exec(websiteUrl)) {
            toast.error("Please enter a valid URL starting with http:// or https://");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.set("name", name);
            formData.set("slug", slug);
            formData.set("description", description);
            // Save paths (not URLs) to database
            formData.set("logoUrl", logoPath);
            formData.set("bannerUrl", bannerPath);
            formData.set("primaryColor", primaryColor);
            formData.set("secondaryColor", secondaryColor);
            formData.set("websiteUrl", websiteUrl);
            formData.set("contactEmail", contactEmail);

            const result = await updateExistingOrganization(organization.id, formData);
            if (result.success) {
                toast.success("Organization updated successfully!");
            } else {
                toast.error(result.error ?? "Failed to update organization.");
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Branding - Banner with overlapping Logo */}
            <div className="relative rounded-lg overflow-visible mb-16">
                {/* Hidden file inputs */}
                <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                />
                <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    id="banner-upload"
                />

                {/* Banner */}
                <div className="relative h-32 md:h-40 w-full rounded-lg overflow-hidden bg-muted group">
                    {bannerDisplayUrl ? (
                        <>
                            <Image
                                src={bannerDisplayUrl}
                                alt="Organization banner"
                                fill
                                className="object-cover"
                            />
                            {/* Hover overlay */}
                            <button
                                type="button"
                                onClick={() => bannerInputRef.current?.click()}
                                disabled={isUploadingBanner}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            >
                                {isUploadingBanner ? (
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                ) : (
                                    <div className="flex flex-col items-center text-white">
                                        <Pencil className="h-6 w-6 mb-1" />
                                        <span className="text-sm font-medium">Change Banner</span>
                                    </div>
                                )}
                            </button>
                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={handleRemoveBanner}
                                className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-sm hover:bg-destructive/90 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="w-full h-full flex flex-col items-center bg-gray-100! justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={isUploadingBanner}
                        >
                            {isUploadingBanner ? (
                                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                            ) : (
                                <>
                                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Click to upload banner</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Recommended 1920x600px</p>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Logo - Overlapping */}
                <div className="absolute -bottom-10 left-4 md:left-6">
                    <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-xl bg-gray-100 p-1.5 group">
                        {logoDisplayUrl ? (
                            <>
                                <Image
                                    src={logoDisplayUrl}
                                    alt={name}
                                    fill
                                    className="object-cover border-white border-2 rounded-lg"
                                />
                                {/* Hover overlay */}
                                <button
                                    type="button"
                                    onClick={() => logoInputRef.current?.click()}
                                    disabled={isUploadingLogo}
                                    className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                >
                                    {isUploadingLogo ? (
                                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                                    ) : (
                                        <Pencil className="h-5 w-5 text-white" />
                                    )}
                                </button>
                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={handleRemoveLogo}
                                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="w-full h-full bg-white flex items-center justify-center text-primary rounded-lg cursor-pointer hover:bg-primary-600/10 transition-colors"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={isUploadingLogo}
                            >
                                {isUploadingLogo ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <Building2 className="h-8 text-primary-600 w-8 md:h-10 md:w-10" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Basic Information */}
            <Card className=" ">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Basic Information
                    </CardTitle>
                    <CardDescription>
                        Your organization&apos;s name and public URL
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="org-name">Organization Name</Label>
                            <Input
                                id="org-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Organization"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="org-slug">URL Slug</Label>
                            <Input
                                id="org-slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replaceAll(/[^a-z0-9-]/g, ""))}
                                placeholder="your-org"
                            />
                            <p className="text-xs text-muted-foreground">afrotix.com/{slug || "your-org"}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="org-description">Description</Label>
                        <Textarea
                            id="org-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell people about your organization..."
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Colors */}
            <Card className="@container">
                <CardContent className="pt-6 @lg:grid @2xl:grid-cols-[auto_360px] @lg:gap-6">
                    {/* Primary Color */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <Palette className="h-5 w-5" />
                            Brand Colors
                        </div>
                        <p className="text-sm text-muted-foreground -mt-4">
                            Customize your organization&apos;s color scheme
                        </p>

                        <div className="space-y-3">
                            <Label>Primary Color</Label>
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
                                    className="h-9 w-14 p-1 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    placeholder="#6366f1"
                                    className="flex-1 font-mono text-sm"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Secondary Color */}
                        <div className="space-y-3">
                            <Label>Secondary Color</Label>
                            <p className="text-xs text-muted-foreground">
                                Used for backgrounds and secondary elements
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={`secondary-${color.value}`}
                                        type="button"
                                        onClick={() => setSecondaryColor(color.value)}
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-all",
                                            secondaryColor === color.value
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
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="h-9 w-14 p-1 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    placeholder="#1e293b"
                                    className="flex-1 font-mono text-sm"
                                />
                            </div>
                        </div>

                    </div>

                    <div className="mt-6 @lg:mt-0 flex justify-center @lg:sticky @lg:top-0 @lg:self-start">
                        <TicketPreview
                            primaryColor={primaryColor}
                            secondaryColor={secondaryColor}
                            logoUrl={logoDisplayUrl}
                            organizationName={name || undefined}
                        />
                    </div>
                    {/* Ticket Preview */}

                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Contact Information
                    </CardTitle>
                    <CardDescription>
                        How people can reach your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="org-website" className="flex items-center gap-1">
                                <Globe className="h-3.5 w-3.5" /> Website
                            </Label>
                            <Input
                                id="org-website"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                placeholder="https://yoursite.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="org-email" className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" /> Contact Email
                            </Label>
                            <Input
                                id="org-email"
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="contact@yourorg.com"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button type="submit" variant='tertiary' disabled={isPending} size="sm">
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Changes...
                        </>
                    ) : (
                        "Save All Changes"
                    )}
                </Button>
            </div>
        </form>
    );
}
