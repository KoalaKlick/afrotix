import { 
    Share2, 
    Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import custom SVG icons as components
import WhatsAppIcon from "@/app/assert/whatsapp.svg";
import GoogleDriveIcon from "@/app/assert/google-drive.svg";
import FacebookIcon from "@/app/assert/facebook.svg";
import XIcon from "@/app/assert/x-icon.svg";
import InstagramIcon from "@/app/assert/instagram.svg";
import TelegramIcon from "@/app/assert/telegram.svg";
import PixiesetIcon from "@/app/assert/pixieset.svg";
import DropboxIcon from "@/app/assert/dropbox.svg";
import FlickrIcon from "@/app/assert/flickr.svg";
import LinkedInIcon from "@/app/assert/linkedin.svg";

/**
 * Detects the social media platform from a URL and returns a label and icon.
 */
export const getSocialPlatform = (url: string, className?: string) => {
    const u = url.toLowerCase();
    const iconClass = cn("shrink-0", className);

    if (u.includes("wa.me") || u.includes("whatsapp")) {
        return { 
            name: "WhatsApp", 
            icon: <WhatsAppIcon className={iconClass} />,
            color: "text-[#25D366]"
        };
    }
    if (u.includes("t.me") || u.includes("telegram")) {
        return { 
            name: "Telegram", 
            icon: <TelegramIcon className={iconClass} />,
            color: "text-[#0088cc]"
        };
    }
    if (u.includes("facebook.com") || u.includes("fb.me")) {
        return { 
            name: "Facebook", 
            icon: <FacebookIcon className={iconClass} />,
            color: "text-[#1877F2]"
        };
    }
    if (u.includes("x.com") || u.includes("twitter.com")) {
        return { 
            name: "X / Twitter", 
            icon: <XIcon className={iconClass} />,
            color: "text-foreground"
        };
    }
    if (u.includes("instagram.com")) {
        return { 
            name: "Instagram", 
            icon: <InstagramIcon className={iconClass} />,
            color: "text-[#E4405F]"
        };
    }
    if (u.includes("linkedin.com")) {
        return { 
            name: "LinkedIn", 
            icon: <LinkedInIcon className={iconClass} />,
            color: "text-[#0A66C2]"
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
            icon: <GoogleDriveIcon className={iconClass} />,
            color: "text-primary"
        };
    }
    if (u.includes("pixieset.com")) {
        return { 
            name: "Pixieset", 
            icon: <PixiesetIcon className={iconClass} />,
            color: "text-purple-500"
        };
    }
    if (u.includes("dropbox.com")) {
        return { 
            name: "Dropbox", 
            icon: <DropboxIcon className={iconClass} />,
            color: "text-blue-500"
        };
    }
    if (u.includes("flickr.com")) {
        return { 
            name: "Flickr", 
            icon: <FlickrIcon className={iconClass} />,
            color: "text-pink-500"
        };
    }
    
    return { 
        name: "Photo Gallery", 
        icon: <Globe className={cn(iconClass, "text-muted-foreground")} />,
        color: "text-muted-foreground"
    };
};
