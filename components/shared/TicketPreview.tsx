import Image from "next/image";
import { Building2, QrCode } from "lucide-react";
import DashedBorder from "@/components/shared/DashedBorder";

interface TicketPreviewProps {
    readonly primaryColor: string;
    readonly secondaryColor: string;
    readonly logoUrl?: string | null;
    readonly organizationName?: string;
    readonly eventName?: string;
    readonly ticketType?: string;
    readonly dateTime?: string;
    readonly venue?: string;
    readonly ticketCode?: string;
    readonly className?: string;
}

export function TicketPreview({
    primaryColor,
    secondaryColor,
    logoUrl,
    organizationName = "Your Organization",
    eventName = "Sample Event 2026",
    ticketType = "General Admission",
    dateTime = "18 Mar 2026, 7:00 PM",
    venue = "Convention Center, Accra",
    ticketCode = "XXXX-XXXXXX",
    className,
}: TicketPreviewProps) {
    return (
        <div className={className}>
            <div className="relative pt-6">
                {/* Fanned full ticket copies behind — spread like a deck of cards */}
                {[-8, -4, 4, 8].map((rotate, i) => (
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
                            <div className="px-6 py-5 flex flex-col items-center gap-2" style={{ backgroundColor: `${secondaryColor}33` }}>
                                {logoUrl ? (
                                    <div className="relative h-10 w-10 rounded-lg overflow-hidden">
                                        <Image src={logoUrl} alt={organizationName} fill className="object-cover" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                                        <Building2 className="h-5 w-5 text-white" />
                                    </div>
                                )}
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: primaryColor }}>Event Ticket</span>
                            </div>
                            <div className="bg-white px-6 py-4 space-y-3">
                                <h3 className="text-base font-semibold text-gray-900">{eventName}</h3>
                                <div className="space-y-2.5">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>Ticket Type</p>
                                        <p className="text-sm text-gray-800">{ticketType}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>Date &amp; Time</p>
                                        <p className="text-sm text-gray-800">{dateTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>Venue</p>
                                        <p className="text-sm text-gray-800">{venue}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>Organizer</p>
                                        <p className="text-sm text-gray-800">{organizationName}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-2.5 text-center" style={{ backgroundColor: secondaryColor }}>
                                <span className="text-xs font-medium text-white/80">{organizationName}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Main ticket */}
                <div className="relative z-10 w-full max-w-xs rounded-b-2xl overflow-hidden shadow-lg border bg-white">
                    {/* Ticket Header */}
                    <div
                        className="px-6 py-5 flex flex-col items-center gap-2"
                        style={{ backgroundColor: `${secondaryColor}33` }}
                    >
                        {logoUrl ? (
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden">
                                <Image
                                    src={logoUrl}
                                    alt={organizationName}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div
                                className="h-10 w-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                        )}
                        <span
                            className="text-[10px] font-bold tracking-[0.2em] uppercase"
                            style={{ color: primaryColor }}
                        >
                            Event Ticket
                        </span>
                    </div>

                    {/* Ticket Body */}
                    <div className="bg-white px-6 py-4 space-y-3">
                        <h3 className="text-base font-semibold text-gray-900">
                            {eventName}
                        </h3>

                        <div className="space-y-2.5">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
                                    Ticket Type
                                </p>
                                <p className="text-sm text-gray-800">{ticketType}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
                                    Date &amp; Time
                                </p>
                                <p className="text-sm text-gray-800">{dateTime}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
                                    Venue
                                </p>
                                <p className="text-sm text-gray-800">{venue}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
                                    Organizer
                                </p>
                                <p className="text-sm text-gray-800">{organizationName}</p>
                            </div>
                        </div>

                        <DashedBorder strokeColor="panafrican" dashArray="6 4" className="my-2">
                            <span />
                        </DashedBorder>

                        {/* QR / Code placeholder */}
                        <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-md bg-gray-100 flex items-center justify-center border">
                                <QrCode className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm font-mono font-semibold" style={{ color: primaryColor }}>
                                    {ticketCode}
                                </p>
                                <p className="text-[10px] text-gray-500">Scan to verify ticket</p>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Footer */}
                    <div
                        className="px-6 py-2.5 text-center"
                        style={{ backgroundColor: secondaryColor }}
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
