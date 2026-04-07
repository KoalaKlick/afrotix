import Image from "next/image";
import { Building2, QrCode } from "lucide-react";
import DashedBorder from "@/components/shared/DashedBorder";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";

interface TicketPreviewProps {
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

export function TicketPreview({
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
  stacked = true,
}: TicketPreviewProps) {
  const logoDisplayUrl = getOrgImageUrl(logoUrl);
  const bannerDisplayUrl = getEventImageUrl(bannerImage);
  const flierDisplayUrl = getEventImageUrl(flierImage);
  const heroImageUrl = bannerDisplayUrl || flierDisplayUrl;
  const watermarkImageUrl = flierDisplayUrl || bannerDisplayUrl;
  const watermarkLabel = ticketType.slice(0, 18).toUpperCase();

  return (
    <div className={className}>
      <div className="relative pt-6">
        {/* Fanned full ticket copies behind — spread like a deck of cards */}
        {stacked &&
          [-8, -4, 4, 8].map((rotate, i) => (
            <div
              key={rotate}
              className="absolute inset-0 top-6 pointer-events-none"
              style={{
                transform: `rotate(${rotate}deg)`,
                transformOrigin: "bottom center",
                zIndex: i,
              }}
            >
              <div className="w-full max-w-xs rounded-2xl overflow-hidden border shadow-sm bg-white">
                <div
                  className="relative overflow-hidden px-6 py-5 flex flex-col items-center gap-2"
                  style={{ backgroundColor: `${secondaryColor}33` }}
                >
                  {heroImageUrl && (
                    <>
                      <Image
                        src={heroImageUrl}
                        alt={eventName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(180deg, ${primaryColor}55 0%, ${secondaryColor}35 45%, rgba(255,255,255,0.88) 100%)`,
                        }}
                      />
                    </>
                  )}
                  {logoDisplayUrl ? (
                    <div className="relative z-10 h-10 w-10 bg-black rounded-lg overflow-hidden">
                      {/* <Image
                        src={logoDisplayUrl}
                        alt={organizationName}
                        fill
                        className="object-cover"
                        unoptimized
                      /> */}
                    </div>
                  ) : (
                    <div
                      className="relative z-10 h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <span
                    className="relative z-10 text-[10px] font-bold tracking-[0.2em] uppercase"
                    style={{ color: primaryColor }}
                  >
                    Event Ticket
                  </span>
                </div>
                <div className="relative overflow-hidden bg-white px-6 py-4 space-y-3">
                  {watermarkImageUrl && (
                    <div className="pointer-events-none absolute -bottom-3 right-0 h-24 w-24 overflow-hidden rounded-full opacity-[0.08]">
                      <Image
                        src={watermarkImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div
                    className="pointer-events-none absolute -right-5 top-10 rotate-[-18deg] text-[22px] font-black tracking-[0.28em] opacity-[0.06]"
                    style={{ color: primaryColor }}
                  >
                    {watermarkLabel}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {eventName}
                  </h3>
                  <div className="space-y-2.5">
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: primaryColor }}
                      >
                        Ticket Type
                      </p>
                      <p className="text-sm text-gray-800">{ticketType}</p>
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: primaryColor }}
                      >
                        Date &amp; Time
                      </p>
                      <p className="text-sm text-gray-800">{dateTime}</p>
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: primaryColor }}
                      >
                        Venue
                      </p>
                      <p className="text-sm text-gray-800">{venue}</p>
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: primaryColor }}
                      >
                        Organizer
                      </p>
                      <p className="text-sm text-gray-800">
                        {organizationName}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="px-6 py-2.5 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${tertiaryColor})`,
                  }}
                >
                  <span className="text-xs font-medium text-white/80">
                    {organizationName}
                  </span>
                </div>
              </div>
            </div>
          ))}

        {/* Main ticket */}
        <div className="relative z-10 w-full max-w-xs rounded-b-2xl overflow-hidden shadow-lg border bg-white">
          {/* Ticket Header */}
          <div
            className="relative overflow-hidden px-6 py-5 flex flex-col items-center gap-2"
            style={{ backgroundColor: `${secondaryColor}33` }}
          >
            {heroImageUrl && (
              <>
                <Image
                  src={heroImageUrl}
                  alt={eventName}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${primaryColor}70 0%, ${secondaryColor}45 45%, rgba(255,255,255,0.9) 100%)`,
                  }}
                />
              </>
            )}
            {logoDisplayUrl ? (
              <div className="relative z-10 h-10 w-10 rounded-lg overflow-hidden ring-1 ring-white/60">
                <Image
                  src={logoDisplayUrl}
                  alt={organizationName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="relative z-10 h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Building2 className="h-5 w-5 text-white" />
              </div>
            )}
            <span
              className="relative z-10 text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: primaryColor }}
            >
              Event Ticket
            </span>
          </div>

          {/* Ticket Body */}
          <div className="relative overflow-hidden bg-white px-6 py-4 space-y-3">
            {watermarkImageUrl && (
              <div className="pointer-events-none absolute -bottom-6 right-0 h-28 w-28 overflow-hidden rounded-full opacity-[0.1]">
                <Image
                  src={watermarkImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div
              className="pointer-events-none absolute -right-8 top-8 rotate-[-18deg] text-[28px] font-black tracking-[0.3em] opacity-[0.06]"
              style={{ color: primaryColor }}
            >
              {watermarkLabel}
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {eventName}
            </h3>

            <div className="space-y-2.5">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  Ticket Type
                </p>
                <p className="text-sm text-gray-800">{ticketType}</p>
              </div>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  Date &amp; Time
                </p>
                <p className="text-sm text-gray-800">{dateTime}</p>
              </div>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  Venue
                </p>
                <p className="text-sm text-gray-800">{venue}</p>
              </div>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  Organizer
                </p>
                <p className="text-sm text-gray-800">{organizationName}</p>
              </div>
            </div>

            <DashedBorder
              strokeColor="panafrican"
              dashArray="6 4"
              className="my-2"
            >
              <span />
            </DashedBorder>

            {/* QR / Code placeholder */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-md bg-gray-100 flex items-center justify-center border">
                <QrCode className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p
                  className="text-sm font-mono font-semibold"
                  style={{ color: primaryColor }}
                >
                  {ticketCode}
                </p>
                <p className="text-[10px] text-gray-500">
                  Scan to verify ticket
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Footer */}
          <div
            className="px-6 py-2.5 text-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${tertiaryColor})`,
            }}
          >
            <span className="text-xs font-medium text-white/80">
              {organizationName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
