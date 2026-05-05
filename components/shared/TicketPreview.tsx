"use client";

import { useState } from "react";
import Image from "next/image";
import { QrCode } from "lucide-react";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";

interface TicketCardProps {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly tertiaryColor?: string;
  readonly logoUrl?: string | null;
  readonly flierImage?: string | null;
  readonly bannerImage?: string | null;
  readonly organizationName?: string;
  readonly eventName?: string;
  readonly ticketType?: string;
  readonly dateTime?: string;
  readonly venue?: string;
  readonly ticketCode?: string;
  readonly className?: string;
  readonly stacked?: boolean;
}

function Notches({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div className={`absolute inset-y-0 ${isLeft ? "left-0" : "right-0"} h-full gap-4 flex flex-col w-6 justify-between z-20`}>
      {Array.from({ length: 3}).map((_, i) => (
         <div
        className={`fle h-6 aspect-square bg-background  ${isLeft ? "rounded-r-full nth-[2]:-translate-x-3 first:rounded-tr-none last:rounded-br-none" : "rounded-l-full last:rounded-bl-none nth-[2]:translate-x-3 first:rounded-tl-none"}`}
        
      />
    ))}
    </div>
  );
}

function Stub({
  side,
  primaryColor,
  label,
}: {
  side: "left" | "right";
  primaryColor: string;
  label: string;
}) {
  const radius = side === "left" ? "rounded-l-xl" : "rounded-r-xl";
  const dashBorder = side === "left" ? "border-r" : "border-l";

  return (
    <div
      className={`w-[72px] shrink-0 flex items-center justify-center relative ${radius}`}
      style={{ background: `${primaryColor}14` }}
    >
      {/* Dashed perforation */}
      <div
        className={`absolute top-3 bottom-3 ${dashBorder} border-dashed`}
        style={{
          borderColor: `${primaryColor}44`,
          [side === "left" ? "right" : "left"]: 0,
        }}
      />

      <span
        className="text-[10px] font-black tracking-[0.22em] uppercase opacity-70"
        style={{
          fontFamily: "'Courier New', monospace",
          color: primaryColor,
          writingMode: "vertical-lr",
          transform: side === "left" ? "rotate(180deg)" : "none",
        }}
      >
        {label}
      </span>

      <Notches side={side} />
    </div>
  );
}

/** A stripped-down ticket silhouette used for the stacked ghost copies */
function GhostTicket({
  primaryColor,
  translateX,
  translateY,
  rotate,
  zIndex,
}: {
  primaryColor: string;
  translateX: number;
  translateY: number;
  rotate: number;
  zIndex: number;
}) {
  return (
    <div
      className="absolute inset-0 pointer-events-none rounded-xl"
      style={{
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
        transformOrigin: "center center",
        zIndex,
        background: "#f5f0e8",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.02) 24px)",
        border: `1.5px solid ${primaryColor}22`,
        boxShadow:
          "0 4px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      {/* Left stub strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[72px] rounded-l-xl"
        style={{ background: `${primaryColor}14` }}
      >
        <Notches side="left" />
      </div>
      {/* Right stub strip */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[72px] rounded-r-xl"
        style={{ background: `${primaryColor}14` }}
      >
        <Notches side="right" />
      </div>
    </div>
  );
}

function TicketShell({
  secondaryColor,
  primaryColor,
  children,
}: {
  secondaryColor: string;
  primaryColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-row items-stretch w-full h-full rounded-xl overflow-visible relative"
      style={{
        background: `${secondaryColor}10`,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.025) 24px)",
      }}
    >
      {children}
    </div>
  );
}

export function TicketCard({
  primaryColor,
  secondaryColor,
  tertiaryColor = "#dc2626",
  logoUrl,
  flierImage,
  bannerImage,
  organizationName = "Your Organization",
  eventName = "Sample Event 2026",
  ticketType = "General Admission",
  dateTime = "18 Mar 2026, 7:00 PM",
  venue = "Convention Center, Accra",
  ticketCode = "XXXX-XXXXXX",
  className,
  stacked = false,
}: TicketCardProps) {
  const [flipped, setFlipped] = useState(false);

  const logoDisplayUrl = getOrgImageUrl(logoUrl);
  const bannerDisplayUrl = getEventImageUrl(bannerImage);
  const flierDisplayUrl = getEventImageUrl(flierImage);
  const heroImageUrl = bannerDisplayUrl || flierDisplayUrl;

  const stubLabel = organizationName.slice(0, 10);

  const barWidths = [3, 1.5, 1.5, 3, 1.5, 2, 1.5, 3, 1.5, 1.5, 3, 2, 1.5, 3, 1.5, 2, 3, 1.5, 3, 1.5, 2, 3, 1.5, 1.5, 3, 2, 3, 1.5, 1.5, 3];
  const barHeights = [38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38];

  // Ghost tickets fan to the right like a deck of cards
  const ghosts = [
    { translateX: 24, translateY: 3, rotate: 2.2, zIndex: 1 },
    { translateX: 14, translateY: 2, rotate: 1.3, zIndex: 2 },
    { translateX: 6, translateY: 1, rotate: 0.5, zIndex: 3 },
  ];

  return (
    <div className={`cursor-pointer select-none @container  ${className ?? ""}`} style={{ perspective: 1200 }}>
      {/* Wrapper gives space for the ghost offset on the right */}
      <div className="relative w-full max-w-[560px] h-[210px]" onClick={() => setFlipped((f) => !f)}>

        {/* Ghost (stacked) copies */}
        {stacked && ghosts.map((g, i) => (
          <GhostTicket key={i} primaryColor={primaryColor} {...g} />
        ))}
        {/* Main flippable ticket — sits on top */}
        <div
          className="absolute inset-0 z-10"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(.4,0,.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── FRONT: event info ── */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <TicketShell secondaryColor={secondaryColor} primaryColor={primaryColor}>
              <Stub side="left" primaryColor={primaryColor} label={ticketType} />

              <div className="flex-1 flex items-center gap-3.5 px-5 py-4 overflow-hidden relative">
                {/* Optional hero tint */}
                {heroImageUrl && (
                  <>
                    <Image src={heroImageUrl} alt={eventName} fill className="object-cover opacity-10" unoptimized />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColor}18 0%, transparent 100%)` }} />
                  </>
                )}

                {/* Logo */}
                

                {/* Event info */}
                <div className="flex-1 min-w-0 relative z-10">
                  <span
                    className="block text-[9px] font-black tracking-[0.22em] uppercase opacity-60 mb-0.5"
                    style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                  >
                    {ticketType}
                  </span>
                  <div
                    className="text-base font-bold truncate leading-tight"
                    style={{ fontFamily: "Georgia, serif", color: `${primaryColor}e8` }}
                  >
                    {eventName}
                  </div>
                  <div className="flex flex-col gap-1 mt-1.5">
                    <div>
                      <div className="text-[8px] font-bold tracking-[0.15em] uppercase opacity-50" style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}>
                        Date &amp; Time
                      </div>
                      <div className="text-[11px] text-[#3d3530]" style={{ fontFamily: "Georgia, serif" }}>{dateTime}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-bold tracking-[0.15em] uppercase opacity-50" style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}>
                        Venue
                      </div>
                      <div className="text-[11px] text-[#3d3530] truncate" style={{ fontFamily: "Georgia, serif" }}>{venue}</div>
                    </div>
                  </div>
                </div>

                {/* Thin divider */}
                <div className="self-stretch w-px shrink-0 relative z-10" style={{ background: `${primaryColor}18` }} />

                {/* Organizer */}
                <div className="shrink-0 flex flex-col items-center gap-1 relative z-10">
                  <div
                    className="text-[9px] font-black tracking-[0.15em] uppercase text-center opacity-60"
                    style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                  >
                    Organizer
                  </div>
                  <div
                    className="text-[11px] font-bold text-center"
                    style={{ fontFamily: "Georgia, serif", color: `${primaryColor}cc` }}
                  >
                    {organizationName}
                  </div>
                </div>
              </div>

              <Stub side="right" primaryColor={primaryColor} label={stubLabel} />
            </TicketShell>
          </div>

          {/* ── BACK: QR + barcode ── */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <TicketShell secondaryColor={secondaryColor} primaryColor={primaryColor}>
              <Stub side="left" primaryColor={primaryColor} label="Admit One" />

              <div className="flex-1 @min-md:flex :flex-col  items-center gap-6 px-6 py-4">
                {/* QR code block */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className=" size-12 @min-md:size-18 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}8` }}
                  >
                    <QrCode className="size-6  lg:size-9" style={{ color: primaryColor }} />
                  </div>
                  <div
                    className="text-[8px] font-black tracking-[0.1em] uppercase opacity-40 text-center"
                    style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                  >
                    Scan to verify
                  </div>
                </div>

                {/* Divider */}
                <div className="self-stretch w-px shrink-0" style={{ background: `${primaryColor}18` }} />

                {/* Ticket number + barcode */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="text-[9px] font-black tracking-[0.3em] uppercase opacity-50"
                    style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                  >
                    Ticket No.
                  </div>
                  <div
                    className="text-xl font-black tracking-[0.15em] opacity-85"
                    style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                  >
                    {ticketCode}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {barWidths.map((w, i) => (
                      <div
                        key={i}
                        className="rounded-[1px] opacity-60"
                        style={{ width: w, height: barHeights[i], background: primaryColor }}
                      />
                    ))}
                  </div>
                  <div
                    className="text-[8px] opacity-40"
                    style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                  >
                    {organizationName}
                  </div>
                </div>
              </div>

              <Stub side="right" primaryColor={primaryColor} label={stubLabel} />
            </TicketShell>
          </div>
        </div>{/* end flip card */}
      </div>{/* end relative wrapper */}

      <p
        className="text-center text-[10px] tracking-[0.1em] mt-2.5"
        style={{ fontFamily: "'Courier New', monospace", color: "#9c8e80" }}
      >
        — click to flip —
      </p>
    </div>
  );
}