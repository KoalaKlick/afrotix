/**
 * Event Step 4: Extras
 * Sponsors, Social Links, and Photo Gallery
 */

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    ArrowLeft, 
    Loader2, 
    CheckCircle, 
    Plus, 
    Trash2, 
    Upload, 
    Globe, 
    Image as ImageIcon,
    Share2,
    Link as LinkIcon,
    X
} from "lucide-react";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { MAX_SPONSORS, MAX_GALLERY_LINKS } from "@/lib/const/event";

interface Sponsor {
    name: string;
    logo?: string;
}

interface SocialLink {
    url: string;
}

interface GalleryLink {
    name: string;
    url: string;
}

interface EventStep4Props {
    readonly initialData: {
        sponsors?: Sponsor[];
        socialLinks?: SocialLink[];
        galleryLinks?: GalleryLink[];
    } | null;
    readonly onSuccess: (data: {
        sponsors: Sponsor[];
        socialLinks: SocialLink[];
        galleryLinks: GalleryLink[];
    }) => void;
    readonly onBack: () => void;
    readonly isSubmitting?: boolean;
}

export function EventStep4Extras({ initialData, onSuccess, onBack, isSubmitting }: EventStep4Props) {
    const [sponsors, setSponsors] = useState<Sponsor[]>(initialData?.sponsors ?? []);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialData?.socialLinks ?? []);
    const [galleryLinks, setGalleryLinks] = useState<GalleryLink[]>(initialData?.galleryLinks ?? []);
    const [isUploading, setIsUploading] = useState<number | null>(null);

    const { upload: runUploadLogo } = useImageUpload({
        bucket: "events",
        folder: "sponsors",
        convertOptions: { quality: 0.8, maxWidth: 400, maxHeight: 400, maxSizeMB: 1 },
    });

    const addSponsor = () => {
        if (sponsors.length < MAX_SPONSORS) {
            setSponsors([...sponsors, { name: "" }]);
        }
    };

    const removeSponsor = (index: number) => {
        setSponsors(sponsors.filter((_, i) => i !== index));
    };

    const updateSponsor = (index: number, field: keyof Sponsor, value: string) => {
        const newSponsors = [...sponsors];
        newSponsors[index] = { ...newSponsors[index], [field]: value };
        setSponsors(newSponsors);
    };

    const handleLogoUpload = async (index: number, file: File) => {
        setIsUploading(index);
        try {
            const path = await runUploadLogo(file);
            if (path) {
                updateSponsor(index, "logo", path);
            }
        } finally {
            setIsUploading(null);
        }
    };

    const addSocialLink = () => {
        if (socialLinks.length < 10) {
            setSocialLinks([...socialLinks, { url: "" }]);
        }
    };

    const removeSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const updateSocialLink = (index: number, url: string) => {
        const newLinks = [...socialLinks];
        newLinks[index] = { url };
        setSocialLinks(newLinks);
    };

    const addGalleryLink = () => {
        if (galleryLinks.length < MAX_GALLERY_LINKS) {
            setGalleryLinks([...galleryLinks, { name: "", url: "" }]);
        }
    };

    const removeGalleryLink = (index: number) => {
        setGalleryLinks(galleryLinks.filter((_, i) => i !== index));
    };

    const updateGalleryLink = (index: number, field: keyof GalleryLink, value: string) => {
        const newLinks = [...galleryLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setGalleryLinks(newLinks);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Filter out empty name sponsors or empty url links
        onSuccess({
            sponsors: sponsors.filter(s => s.name.trim() !== ""),
            socialLinks: socialLinks.filter(l => l.url.trim() !== ""),
            galleryLinks: galleryLinks.filter(g => g.name.trim() !== "" && g.url.trim() !== ""),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sponsors Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-lg font-bold flex items-center gap-2">
                            <Plus className="size-5 text-primary" />
                            Sponsors
                        </Label>
                        <p className="text-sm text-muted-foreground">Add event sponsors to showcase their logos</p>
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addSponsor}
                        disabled={sponsors.length >= MAX_SPONSORS}
                    >
                        <Plus className="size-4 mr-2" />
                        Add Sponsor
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sponsors.map((sponsor, index) => (
                        <div key={index} className="relative p-4 rounded-xl border bg-card flex items-start gap-4">
                            <div className="relative group size-16 shrink-0 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                                {sponsor.logo ? (
                                    <>
                                        <img 
                                            src={getEventImageUrl(sponsor.logo)} 
                                            alt={sponsor.name}
                                            className="size-full object-contain p-1"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => updateSponsor(index, "logo", "")}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            <X className="size-4 text-white" />
                                        </button>
                                    </>
                                ) : (
                                    <label className="cursor-pointer size-full flex flex-col items-center justify-center gap-1">
                                        {isUploading === index ? (
                                            <Loader2 className="size-5 animate-spin text-primary" />
                                        ) : (
                                            <>
                                                <Upload className="size-4 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">Logo</span>
                                            </>
                                        )}
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleLogoUpload(index, file);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <Input 
                                    placeholder="Sponsor Name"
                                    value={sponsor.name}
                                    onChange={(e) => updateSponsor(index, "name", e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeSponsor(index)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))}
                    {sponsors.length === 0 && (
                        <div className="col-span-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <ImageIcon className="size-8 opacity-20" />
                            <p className="text-sm">No sponsors added yet (optional)</p>
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-muted" />

            {/* Social Links Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-lg font-bold flex items-center gap-2">
                            <Share2 className="size-5 text-primary" />
                            Organization Socials
                        </Label>
                        <p className="text-sm text-muted-foreground">Dynamic links to your social media profiles</p>
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addSocialLink}
                        disabled={socialLinks.length >= 10}
                    >
                        <Plus className="size-4 mr-2" />
                        Add Link
                    </Button>
                </div>

                <div className="space-y-3">
                    {socialLinks.map((link, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <div className="bg-primary/5 p-2.5 rounded-lg">
                                <LinkIcon className="size-4 text-primary" />
                            </div>
                            <Input 
                                placeholder="Social Media URL (e.g., t.me/organization)"
                                value={link.url}
                                onChange={(e) => updateSocialLink(index, e.target.value)}
                                className="flex-1"
                            />
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeSocialLink(index)}
                                className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))}
                    {socialLinks.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg italic">
                            No social links added yet (optional)
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-muted" />

            {/* Photo Gallery Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-lg font-bold flex items-center gap-2">
                            <ImageIcon className="size-5 text-primary" />
                            Photo Gallery
                        </Label>
                        <p className="text-sm text-muted-foreground">Share links to event photos (Google Drive, Pixieset, etc.)</p>
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addGalleryLink}
                        disabled={galleryLinks.length >= MAX_GALLERY_LINKS}
                    >
                        <Plus className="size-4 mr-2" />
                        Add Gallery
                    </Button>
                </div>

                <div className="space-y-3">
                    {galleryLinks.map((link, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 items-end p-4 rounded-xl border bg-primary/5">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Label</Label>
                                <Input 
                                    placeholder="e.g., Official Photos"
                                    value={link.name}
                                    onChange={(e) => updateGalleryLink(index, "name", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Link URL</Label>
                                <Input 
                                    placeholder="e.g., https://pixieset.com/shared-album"
                                    value={link.url}
                                    onChange={(e) => updateGalleryLink(index, "url", e.target.value)}
                                />
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeGalleryLink(index)}
                                className="h-10 w-10 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))}
                    {galleryLinks.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg italic">
                            No gallery links added yet (optional)
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-8 border-t">
                <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                </Button>

                <Button type="submit" size="lg" disabled={isSubmitting || isUploading !== null}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Finalizing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 size-4" />
                            Complete & Create
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
