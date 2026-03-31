"use client";

import { useEffect, useState } from "react";
import { fetchPaystackBanks } from "@/lib/dal/paystackBanks";
import { getCurrencyByCountryCode } from "@/lib/dal/countries";

interface PayoutAccountCardProps {
    paystackBankCode: string;
    paystackAccountNumber: string;
    paystackAccountName: string;
    /** ISO country code e.g. "GH", "NG" — defaults to "GH" */
    countryCode?: string;
    onEdit?: () => void;
}

export function PayoutAccountCard({
    paystackBankCode,
    paystackAccountNumber,
    paystackAccountName,
    countryCode = "GH",
    onEdit,
}: PayoutAccountCardProps) {
    const [bankName, setBankName] = useState<string>(paystackBankCode);
    const [isMomo, setIsMomo] = useState(false);

    useEffect(() => {
        async function resolveBankName() {
            const currency = getCurrencyByCountryCode(countryCode) || "GHS";
            try {
                const { banks, momo } = await fetchPaystackBanks(currency);
                const match = [...banks, ...momo].find((b) => b.code === paystackBankCode);
                if (match) {
                    setBankName(match.name);
                    setIsMomo(match.type === "mobile_money");
                }
            } catch {
                // fallback: keep the raw code as label
            }
        }
        resolveBankName();
    }, [paystackBankCode, countryCode]);

    // Mask: first 3 digits + •••• + last 4
    const maskedNumber =
        paystackAccountNumber.length > 7
            ? `${paystackAccountNumber.slice(0, 3)} •••• ${paystackAccountNumber.slice(-4)}`
            : paystackAccountNumber;

    return (
        <div
            className="relative w-full max-w-sm overflow-hidden select-none rounded-[12px] h-[200px] font-serif"
            style={{ fontFamily: "Georgia, serif" }}
        >
            {/* Background Gradient */}
            <div
                className={`absolute inset-0 ${
                    isMomo
                        ? "bg-gradient-to-br from-[#1a1a1a] via-[#2d1a00] to-[#1a1a1a]"
                        : "bg-gradient-to-br from-[#006400] via-[#1a1a1a] to-[#8b0000]"
                }`}
            />

            {/* Decorative Glow Circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#dca000] opacity-10" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#dca000] opacity-5" />

            {/* Pan-African Stripe - Top */}
            <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#cc0000] via-[#dd9900] via-[#007a00] via-[#cc0000] to-[#dd9900]" />

            {/* Pan-African Stripe - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#007a00] via-[#dd9900] via-[#cc0000] via-[#007a00] to-[#dd9900]" />

            {/* Golden Metallic Chip */}
            <div className="absolute top-5 left-[22px] w-[46px] h-[34px] rounded-md bg-gradient-to-br from-[#c8a325] via-[#f5d96b] via-[#a07010] via-[#e8c040] to-[#c8a325] shadow-lg flex items-center justify-center">
                <div className="w-9 h-6 rounded-sm border border-[#ffd05099] grid grid-cols-2 grid-rows-2 gap-px p-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-[#784f0033] rounded-sm" />
                    ))}
                </div>
            </div>

            {/* Network / Bank Badge */}
            <div className="absolute top-[22px] right-5">
                {isMomo ? (
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#dd9900] opacity-80" />
                        <span className="text-[11px] text-[#ffd700bf] font-mono tracking-[2px]">
                           Momo Account
                        </span>
                    </div>
                ) : (
                    /* Mastercard-style overlapping circles */
                    <div className="flex items-center">
                        <div className="w-[22px] h-[22px] rounded-full bg-[#cc0000] opacity-90" />
                        <div className="w-[22px] h-[22px] rounded-full bg-[#dd9900] opacity-75 -ml-2" />
                    </div>
                )}
            </div>

            {/* Account Number */}
            <div className="absolute top-[70px] left-[22px] right-[22px]">
                <p className="text-[10px] text-[#ffd70080] tracking-[3px] uppercase mb-1">
                    ACCOUNT NUMBER
                </p>
                <p className="text-[22px] font-bold text-[#f5d96b] tracking-[5px] font-mono shadow-sm">
                    {maskedNumber}
                </p>
            </div>

            {/* Account Name + Bank/Network */}
            <div className="absolute bottom-4 left-[22px] right-[22px] flex justify-between items-end">
                <div>
                    <p className="text-[9px] text-[#ffd70073] tracking-[2px] uppercase mb-0.5">
                        ACCOUNT NAME
                    </p>
                    <p className="text-[13px] text-white font-bold tracking-[2px]">
                        {paystackAccountName}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-[9px] text-[#ffd70073] tracking-[2px] uppercase mb-0.5">
                        {isMomo ? "NETWORK" : "BANK"}
                    </p>
                    <p className="text-[12px] text-[#f5d96b] tracking-wider max-w-[140px] truncate">
                        {bankName}
                    </p>
                </div>
            </div>

            {/* Change Account Button */}
            {onEdit && (
                <button
                    onClick={onEdit}
                    className="absolute bottom-0 left-0 right-0 bg-transparent border-t border-[#ffd70026] py-1.5 px-4 text-[#ffd700b3] hover:text-[#ffd700] hover:opacity-100 opacity-70 transition-all duration-200 text-xs tracking-widest uppercase flex items-center justify-center gap-1.5"
                >
                    Change account →
                </button>
            )}
        </div>
    );
}