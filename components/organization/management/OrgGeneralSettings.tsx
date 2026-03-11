"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Building2, Globe, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateExistingOrganization } from "@/lib/actions/organization";

interface OrgGeneralSettingsProps {
    readonly organization: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        websiteUrl: string | null;
        contactEmail: string | null;
    };
}

export function OrgGeneralSettings({ organization }: OrgGeneralSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState(organization.name);
    const [slug, setSlug] = useState(organization.slug);
    const [description, setDescription] = useState(organization.description ?? "");
    const [websiteUrl, setWebsiteUrl] = useState(organization.websiteUrl ?? "");
    const [contactEmail, setContactEmail] = useState(organization.contactEmail ?? "");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        startTransition(async () => {
            const formData = new FormData();
            formData.set("name", name);
            formData.set("slug", slug);
            formData.set("description", description);
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    General Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
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
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
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

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
