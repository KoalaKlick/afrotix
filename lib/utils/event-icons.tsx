import { 
    MessageCircle, 
    Send, 
    Facebook, 
    Twitter, 
    Instagram, 
    Share2, 
    HardDrive, 
    Image as ImageIcon, 
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Detects the social media platform from a URL and returns a label and icon.
 */
export const getSocialPlatform = (url: string, className?: string) => {
    const u = url.toLowerCase();
    const iconClass = cn("shrink-0", className);

    if (u.includes("wa.me") || u.includes("whatsapp")) {
        return { 
            name: "WhatsApp", 
            icon: <MessageCircle className={cn(iconClass, "text-green-500")} />,
            color: "text-green-500"
        };
    }
    if (u.includes("t.me") || u.includes("telegram")) {
        return { 
            name: "Telegram", 
            icon: <Send className={cn(iconClass, "text-blue-400")} />,
            color: "text-blue-400"
        };
    }
    if (u.includes("facebook.com") || u.includes("fb.me")) {
        return { 
            name: "Facebook", 
            icon: <Facebook className={cn(iconClass, "text-blue-600")} />,
            color: "text-blue-600"
        };
    }
    if (u.includes("x.com") || u.includes("twitter.com")) {
        return { 
            name: "X / Twitter", 
            icon: <Twitter className={iconClass} />,
            color: "text-foreground"
        };
    }
    if (u.includes("instagram.com")) {
        return { 
            name: "Instagram", 
            icon: <Instagram className={cn(iconClass, "text-pink-600")} />,
            color: "text-pink-600"
        };
    }
    
    return { 
        name: "Social Link", 
        icon: <Share2 className={cn(iconClass, "text-muted-foreground")} />,
        color: "text-muted-foreground"
    };
};

/**
 * Detects the photo gallery provider from a URL and returns a label and icon.
 */
export const getGalleryProvider = (url: string, className?: string) => {
    const u = url.toLowerCase();
    const iconClass = cn("shrink-0", className);

    if (u.includes("drive.google.com")) {
        return { 
            name: "Google Drive", 
            icon: <HardDrive className={cn(iconClass, "text-primary")} />,
            color: "text-primary"
        };
    }
    if (u.includes("pixieset.com")) {
        return { 
            name: "Pixieset", 
            icon: <ImageIcon className={cn(iconClass, "text-purple-500")} />,
            color: "text-purple-500"
        };
    }
    if (u.includes("dropbox.com")) {
        return { 
            name: "Dropbox", 
            icon: <HardDrive className={cn(iconClass, "text-blue-500")} />,
            color: "text-blue-500"
        };
    }
    if (u.includes("flickr.com")) {
        return { 
            name: "Flickr", 
            icon: <ImageIcon className={cn(iconClass, "text-pink-500")} />,
            color: "text-pink-500"
        };
    }
    
    return { 
        name: "Photo Gallery", 
        icon: <Globe className={cn(iconClass, "text-muted-foreground")} />,
        color: "text-muted-foreground"
    };
};
