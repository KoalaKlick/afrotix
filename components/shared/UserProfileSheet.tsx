"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, User } from "lucide-react";
import Image from "next/image";
import { Avatar as UserAvatar } from "@/components/shared/image/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetBody,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAvatarUrl } from "@/lib/image-url-utils";
import { convertToWebP } from "@/lib/image-utils";
import { uploadUserAvatar, updateUserProfile } from "@/lib/actions/profile";
import { useRouter } from "next/navigation";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";

const MOMO_NETWORKS = [
    { code: "MTN", label: "MTN MoMo" },
    { code: "VOD", label: "Vodafone Cash" },
    { code: "ATL", label: "AirtelTigo Money" },
];

interface UserProfileSheetProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly user: {
        name: string;
        email: string;
        avatar: string;
        username?: string;
        momoNumber?: string;
        momoNetwork?: string;
    };
}

export function UserProfileSheet({ open, onOpenChange, user }: UserProfileSheetProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fullName, setFullName] = useState(user.name);
    const [username, setUsername] = useState(user.username ?? "");
    const [momoNumber, setMomoNumber] = useState(user.momoNumber ?? "");
    const [momoNetwork, setMomoNetwork] = useState(user.momoNetwork ?? "");

    const [avatarPath, setAvatarPath] = useState(user.avatar ?? "");
    const [avatarPreview, setAvatarPreview] = useState(
        user.avatar ? (getAvatarUrl(user.avatar) ?? "") : ""
    );
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
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

        setIsUploadingAvatar(true);
        try {
            const webpFile = await convertToWebP(file, {
                quality: 1,
                maxWidth: 400,
                maxHeight: 400,
                maxSizeMB: 0.5,
            });

            // Show local preview immediately
            const reader = new FileReader();
            reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
            reader.readAsDataURL(webpFile);

            const formData = new FormData();
            formData.append("file", webpFile);
            if (avatarPath) formData.append("oldAvatarPath", avatarPath);

            const result = await uploadUserAvatar(formData);
            if (result.success && result.data?.path) {
                setAvatarPath(result.data.path);
                setAvatarPreview(getAvatarUrl(result.data.path) ?? avatarPreview);
            } else {
                toast.error(result.error ?? "Failed to upload avatar");
                setAvatarPreview(user.avatar ? (getAvatarUrl(user.avatar) ?? "") : "");
            }
        } catch {
            toast.error("Failed to process image");
            setAvatarPreview(user.avatar ? (getAvatarUrl(user.avatar) ?? "") : "");
        } finally {
            setIsUploadingAvatar(false);
        }
    }

    function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();

        startTransition(async () => {
            const formData = new FormData();
            if (fullName.trim()) formData.set("fullName", fullName.trim());
            if (username.trim()) formData.set("username", username.trim());
            if (momoNumber.trim()) formData.set("momoNumber", momoNumber.trim());
            if (momoNetwork) formData.set("momoNetwork", momoNetwork);
            if (avatarPath) formData.set("avatarUrl", avatarPath);

            const result = await updateUserProfile(formData);
            if (result.success) {
                toast.success("Profile updated!");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.error ?? "Failed to update profile");
            }
        });
    }

    return (
        <Sheet  open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" variant="afro" className="w-full sm:max-w-md flex flex-col h-full">
                <SheetHeader className="shrink-0">
                    <SheetTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Account Settings
                    </SheetTitle>
                    <SheetDescription>Update your personal profile details.</SheetDescription>
                </SheetHeader>

                <PanAfricanDivider className="h-1 shrink-0" />

                <SheetBody className="flex-1 overflow-y-auto py-4 pr-2">
                    <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                className="relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Change profile photo"
                            >
                                <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-border">
                                    {avatarPreview ? (
                                        <Image
                                            src={avatarPreview}
                                            alt={fullName}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <UserAvatar
                                            src=""
                                            alt={fullName}
                                            fullName={fullName}
                                            width={80}
                                            height={80}
                                            className="h-20 w-20 rounded-full"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                        {isUploadingAvatar ? (
                                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                                        ) : (
                                            <Pencil className="h-5 w-5 text-white" />
                                        )}
                                    </div>
                                </div>
                            </button>
                            <p className="text-xs text-muted-foreground">Click to change photo</p>
                        </div>

                        {/* Read-only email */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
                            <Input value={user.email} disabled className="bg-muted/40" />
                        </div>

                        {/* Full name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-fullname" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                            <Input
                                id="profile-fullname"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full name"
                            />
                        </div>

                        {/* Username */}
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-username" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Username</Label>
                            <Input
                                id="profile-username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                placeholder="your_username"
                            />
                            <p className="text-xs text-muted-foreground">
                                3–30 lowercase letters, numbers or underscores.
                            </p>
                        </div>

                        {/* MoMo details */}
                        <div className="space-y-4 rounded-lg border p-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Mobile Money (MoMo)</p>

                            <div className="space-y-1.5">
                                <Label htmlFor="profile-momo-network" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Network</Label>
                                <Select value={momoNetwork} onValueChange={setMomoNetwork}>
                                    <SelectTrigger id="profile-momo-network">
                                        <SelectValue placeholder="Select network" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MOMO_NETWORKS.map((n) => (
                                            <SelectItem key={n.code} value={n.code}>
                                                {n.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="profile-momo-number" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">MoMo Number</Label>
                                <Input
                                    id="profile-momo-number"
                                    value={momoNumber}
                                    onChange={(e) => setMomoNumber(e.target.value)}
                                    placeholder="e.g. 0241234567"
                                    type="tel"
                                />
                            </div>
                        </div>
                    </form>
                </SheetBody>

                <SheetFooter className="shrink-0 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="profile-form"
                        disabled={isPending || isUploadingAvatar}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
