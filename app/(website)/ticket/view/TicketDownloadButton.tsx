"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import * as htmlToImage from "html-to-image";

interface TicketDownloadButtonProps {
  fileName?: string;
}

export function TicketDownloadButton({ fileName = "afrotix-ticket" }: TicketDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const node = document.getElementById("ticket-container");
      
      if (!node) {
        console.error("Ticket container not found");
        return;
      }

      // Add a small delay to ensure any fonts/images are loaded
      await new Promise((resolve) => setTimeout(resolve, 500));

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1.0,
        pixelRatio: 2, // High resolution
        skipAutoScale: true,
      });

      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating ticket image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      size="lg" 
      className="rounded-full px-8" 
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="mr-2 size-5 animate-spin" />
      ) : (
        <Download className="mr-2 size-5" />
      )}
      {isDownloading ? "Generating Image..." : "Save Ticket Image"}
    </Button>
  );
}

