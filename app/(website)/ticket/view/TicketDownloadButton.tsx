"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TicketDownloadButtonProps {
  fileName?: string;
  elementId?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  fileFormat?: "png" | "svg";
  className?: string;
}

export function TicketDownloadButton({ 
  fileName = "afrotix-ticket",
  elementId = "ticket-container",
  label = "Save Ticket Image",
  variant = "default",
  fileFormat = "png",
  className
}: TicketDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const node = document.getElementById(elementId);
      
      if (!node) {
        console.error(`Element with id ${elementId} not found`);
        return;
      }

      // Add a small delay to ensure any fonts/images are loaded
      await new Promise((resolve) => setTimeout(resolve, 500));

      let dataUrl = "";
      
      if (fileFormat === "svg") {
        dataUrl = await htmlToImage.toSvg(node, {
          cacheBust: true,
        });
      } else {
        dataUrl = await htmlToImage.toPng(node, {
          quality: 1.0,
          pixelRatio: 4, // Extreme resolution
          skipAutoScale: true,
          cacheBust: true,
        });
      }

      const link = document.createElement("a");
      link.download = `${fileName}.${fileFormat}`;
      link.href = dataUrl;
      link.click();
      
      toast.success(`${fileFormat.toUpperCase()} exported successfully`);
    } catch (err) {
      console.error(`Error generating ticket ${fileFormat}:`, err);
      toast.error(`Failed to export ${fileFormat.toUpperCase()}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      size="lg" 
      variant={variant}
      className={cn(" px-8", className)} 
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="mr-2 size-5 animate-spin" />
      ) : (
        <Download className="mr-2 size-5" />
      )}
      {isDownloading ? "Generating..." : label}
    </Button>
  );
}

