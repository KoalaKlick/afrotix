"use client";

import { useState, useId } from "react";
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

/**
 * Builds a clip-path that describes the ticket silhouette:
 * a rounded rectangle with 3 semicircular notches punched into each side.
 *
 * All values are expressed as percentages of the element's bounding box so the
 * clip scales automatically when the element resizes.
 *
 * The path uses the SVG "even-odd" fill rule, so the semicircle sub-paths
 * act as holes (they are wound opposite to the outer rect).
 */
function TicketClipPath({ id }: { id: string }) {
  const W = 560;
  const H = 210;
  const r = 12;   // outer corner radius
  const nr = 12;  // notch semicircle radius
  const stubW = 72;

  const d = [
    `M ${r} 0`,
    // Top Edge
    `L ${stubW - nr} 0 A ${nr} ${nr} 0 0 0 ${stubW + nr} 0`,
    `L ${W - stubW - nr} 0 A ${nr} ${nr} 0 0 0 ${W - stubW + nr} 0`,
    `L ${W - r} 0`,
    // Corner
    `Q ${W} 0 ${W} ${r}`,
    // Right Edge
    `L ${W} ${H / 2 - nr} A ${nr} ${nr} 0 0 0 ${W} ${H / 2 + nr}`,
    `L ${W} ${H - r}`,
    // Corner
    `Q ${W} ${H} ${W - r} ${H}`,
    // Bottom Edge
    `L ${W - stubW + nr} ${H} A ${nr} ${nr} 0 0 0 ${W - stubW - nr} ${H}`,
    `L ${stubW + nr} ${H} A ${nr} ${nr} 0 0 0 ${stubW - nr} ${H}`,
    `L ${r} ${H}`,
    // Corner
    `Q 0 ${H} 0 ${H - r}`,
    // Left Edge
    `L 0 ${H / 2 + nr} A ${nr} ${nr} 0 0 0 0 ${H / 2 - nr}`,
    `L 0 ${r}`,
    // Corner
    `Q 0 0 ${r} 0`,
    `Z`,
  ].join(" ");

  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={id} clipPathUnits="userSpaceOnUse">
          <path d={d} />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Dashed perforation line inside the stub */
function StubDash({
  side,
  primaryColor,
}: {
  side: "left" | "right";
  primaryColor: string;
}) {
  const dashBorder = side === "left" ? "border-r" : "border-l";
  return (
    <div
      className={`absolute top-3 bottom-3 ${dashBorder} border-dashed`}
      style={{
        borderColor: `${primaryColor}44`,
        [side === "left" ? "right" : "left"]: 0,
      }}
    />
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

  return (
    <div
      className={`w-[72px] shrink-0 flex items-center justify-center relative ${radius}`}
      style={{ background: `${primaryColor}14` }}
    >
      <StubDash side={side} primaryColor={primaryColor} />
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
    </div>
  );
}

/** Ghost ticket for the stacked deck effect — clipped the same way */
function GhostTicket({
  secondaryColor,
  primaryColor,
  clipId,
  translateX = 20,
  translateY = 30,
  rotate = 5,
  zIndex = 0,
}: {
  secondaryColor: string;
  primaryColor: string;
  clipId: string;
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
        clipPath: `url(#${clipId})`,
        backgroundColor: "#ffffff",
        backgroundImage: `linear-gradient(${secondaryColor}14, ${secondaryColor}14), repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.02) 24px)`,
        border: `1.5px solid ${primaryColor}22`,
      }}
    >
      {/* Left stub strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[72px] rounded-l-xl"
        style={{ background: `${primaryColor}14` }}
      />
      {/* Right stub strip */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[72px] rounded-r-xl"
        style={{ background: `${primaryColor}14` }}
      />
    </div>
  );
}

function TicketShell({
  secondaryColor,
  primaryColor,
  clipId,
  children,
}: {
  secondaryColor: string;
  primaryColor: string;
  clipId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-row items-stretch w-full h-full relative"
      style={{
        clipPath: `url(#${clipId})`,
        backgroundColor: "#ffffff",
        backgroundImage: `linear-gradient(${secondaryColor}12, ${secondaryColor}12), repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.025) 24px)`,
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
  // Stable unique ID so multiple tickets on the same page don't share clipPaths
  const uid = useId().replace(/:/g, "");
  const clipId = `ticket-clip-${uid}`;
  // Ghost tickets can share the same clip shape (they're the same dimensions)
  const ghostClipId = `ticket-ghost-clip-${uid}`;

  const logoDisplayUrl = getOrgImageUrl(logoUrl);
  const bannerDisplayUrl = getEventImageUrl(bannerImage);
  const flierDisplayUrl = getEventImageUrl(flierImage);
  const heroImageUrl = bannerDisplayUrl || flierDisplayUrl;

  const stubLabel = organizationName.slice(0, 10);

  const barWidths = [3, 1.5, 1.5, 3, 1.5, 2, 1.5, 3, 1.5, 1.5, 3, 2, 1.5, 3, 1.5, 2, 3, 1.5, 3, 1.5, 2, 3, 1.5, 1.5, 3, 2, 3, 1.5, 1.5, 3];
  const barHeights = [38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38];

  const ghosts = [
    { translateX: 24, translateY: 3, rotate: 22, zIndex: 1 },
    { translateX: 14, translateY: 2, rotate: 13, zIndex: 2 },
    { translateX: 6, translateY: 1, rotate: 5, zIndex: 3 },
  ];

  return (
    <div
      className={`cursor-pointer select-none @container ${className ?? ""}`}
      style={{ perspective: 1200 }}
    >
      {/* Hidden SVG that defines the clip-paths */}
      <TicketClipPath id={clipId} />
      <TicketClipPath id={ghostClipId} />

      <div
        className="relative w-full max-w-[560px] h-[210px]"
        onClick={() => setFlipped((f) => !f)}
      >
        {/* Ghost (stacked) copies */}
        {stacked &&
          ghosts.map((g, i) => (
            <GhostTicket
              key={i}
              secondaryColor={secondaryColor}
              primaryColor={primaryColor}
              clipId={ghostClipId}
              {...g}
            />
          ))}

        {/* Main flippable ticket */}
        <div
          className="absolute inset-0 z-10"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(.4,0,.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── FRONT ── */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <TicketShell
              secondaryColor={secondaryColor}
              primaryColor={primaryColor}
              clipId={clipId}
            >
              <Stub side="left" primaryColor={primaryColor} label={ticketType} />

              <div className="flex-1 @min-md:flex items-center gap-3.5 px-5 py-4 overflow-hidden relative">
                {heroImageUrl && (
                  <>
                    <Image
                      src={heroImageUrl}
                      alt={eventName}
                      fill
                      className="object-cover opacity-10"
                      unoptimized
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}18 0%, transparent 100%)`,
                      }}
                    />
                  </>
                )}

                <div className="flex-1 min-w-0 relative z-10">
                  <span
                    className="block text-[9px] font-black tracking-[0.22em] uppercase opacity-60 mb-0.5"
                    style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                  >
                    {ticketType}
                  </span>
                  <div className="text-base @min-lg:text-lg uppercase font-montserrat font-bold truncate leading-tight">
                    {eventName}
                  </div>
                  <div className="flex flex-col gap-1 mt-1.5">
                    <div>
                      <div
                        className="text-[8px] font-bold tracking-[0.15em] uppercase opacity-50"
                        style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                      >
                        Date &amp; Time
                      </div>
                      <div
                        className="text-[11px] text-[#3d3530]"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {dateTime}
                      </div>
                    </div>
                    <div>
                      <div
                        className="text-[8px] font-bold tracking-[0.15em] uppercase opacity-50"
                        style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                      >
                        Venue
                      </div>
                      <div
                        className="text-[11px] text-[#3d3530] truncate"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {venue}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="self-stretch w-px shrink-0 relative z-10"
                  style={{ background: `${primaryColor}18` }}
                />

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

          {/* ── BACK ── */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <TicketShell
              secondaryColor={secondaryColor}
              primaryColor={primaryColor}
              clipId={clipId}
            >
              <Stub side="left" primaryColor={primaryColor} label="Admit One" />

              <div className="flex-1 @min-md:flex items-center gap-6 px-6 py-4">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className="size-12 @min-md:size-18 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}8` }}
                  >
                    <QrCode className="size-6 lg:size-9" style={{ color: primaryColor }} />
                  </div>
                  <div
                    className="text-[8px] font-black tracking-[0.1em] uppercase opacity-40 text-center"
                    style={{ fontFamily: "'Courier New', monospace", color: primaryColor }}
                  >
                    Scan to verify
                  </div>
                </div>

                <div
                  className="self-stretch w-px shrink-0"
                  style={{ background: `${primaryColor}18` }}
                />

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
        </div>
      </div>
    </div>
  );
}