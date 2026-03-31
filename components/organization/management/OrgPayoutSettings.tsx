"use client";

import { useState, useTransition, useEffect } from "react";
import { Check, Loader2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { supportedCountries, getCurrencyByCountryCode } from "@/lib/dal/countries";
import { fetchPaystackBanks } from "@/lib/dal/paystackBanks";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { PayoutAccountCard } from "@/components/organization/management/PayoutAccountCard";

interface OrgPayoutSettingsProps {
    readonly organization: {
        id: string;
        name: string;
        paystackBankCode?: string | null;
        paystackAccountNumber?: string | null;
        paystackAccountName?: string | null;
    };
}

interface NetworkOption {
    code: string;
    label: string;
}


export function OrgPayoutSettings({ organization }: OrgPayoutSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [bankType, setBankType] = useState<"momo" | "bank">("momo");
    const [country, setCountry] = useState(supportedCountries[0].code);

    // Local payout state for reactivity
    const [payoutBankCode, setPayoutBankCode] = useState(organization.paystackBankCode ?? "");
    const [payoutAccountNumber, setPayoutAccountNumber] = useState(organization.paystackAccountNumber ?? "");
    const [payoutAccountName, setPayoutAccountName] = useState(organization.paystackAccountName ?? "");

    // Form state
    const [bankCode, setBankCode] = useState(organization.paystackBankCode ?? "");
    const [accountNumber, setAccountNumber] = useState(organization.paystackAccountNumber ?? "");

    // Verification state
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifiedName, setVerifiedName] = useState<string | null>(organization.paystackAccountName ?? null);

    // Separated network lists
    const [banks, setBanks] = useState<NetworkOption[]>([]);
    const [momoNetworks, setMomoNetworks] = useState<NetworkOption[]>([]);
    const [isLoadingNetworks, setIsLoadingNetworks] = useState(false);

    const supabase = createClient();

    // Derived: which list to show in the dropdown
    const networks = bankType === "momo" ? momoNetworks : banks;
    // For Combobox
    const countryOptions = supportedCountries.map((c) => ({ value: c.code, label: c.name }));
    const networkOptions = networks.map((n) => ({ value: n.code, label: n.label }));

    useEffect(() => {
        async function loadNetworks() {
            setIsLoadingNetworks(true);
            setBankCode("");

            const currency = getCurrencyByCountryCode(country) || "GHS";
            try {
                const { banks: fetchedBanks, momo: fetchedMomo } = await fetchPaystackBanks(currency);
                setBanks(fetchedBanks.map((b) => ({ code: b.code, label: b.name })));
                setMomoNetworks(fetchedMomo.map((b) => ({ code: b.code, label: b.name })));
            } catch {
                setBanks([]);
                setMomoNetworks([]);
                toast.error("Failed to load banks. Please try again.");
            } finally {
                setIsLoadingNetworks(false);
            }
        }

        loadNetworks();
    }, [country]); // Only re-fetch when country changes, not bankType

    async function handleVerify() {
        if (!accountNumber || !bankCode) {
            toast.error("Please enter both account number and select a bank/network.");
            return;
        }

        setIsVerifying(true);
        setVerifiedName(null);

        try {
            const { data, error } = await supabase.functions.invoke("verify-account", {
                body: { accountNumber, bankCode },
            });

            if (error || !data?.success) {
                toast.error(data?.message || "Failed to verify account. Please check your details.");
                return;
            }

            setVerifiedName(data.accountName);
            toast.success("Account verified successfully.");
        } catch {
            toast.error("Failed to verify account.");
        } finally {
            setIsVerifying(false);
        }
    }

    async function handleSave() {
        if (!accountNumber || !bankCode) return;

        startTransition(async () => {
            try {
                const { data, error } = await supabase.functions.invoke("create-subaccount", {
                    body: {
                        organizationId: organization.id,
                        businessName: organization.name,
                        accountNumber,
                        bankCode,
                        accountName: verifiedName,
                    },
                });

                if (error || !data?.success) {
                    toast.error(data?.detail || data?.error || data?.message || "Failed to setup transaction account.");
                    return;
                }

                // Update local payout state to trigger re-render of card
                setPayoutBankCode(bankCode);
                setPayoutAccountNumber(accountNumber);
                setPayoutAccountName(verifiedName ?? "");

                toast.success("Transaction account saved successfully!");
            } catch {
                toast.error("An error occurred while saving the account.");
            }
        });
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        Payout Details
                    </CardTitle>
                    <CardDescription>
                        Set up the account where you will receive earnings from ticket sales and votes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {payoutAccountNumber && payoutAccountName && payoutBankCode && (
                        <PayoutAccountCard
                            paystackBankCode={payoutBankCode}
                            paystackAccountNumber={payoutAccountNumber}
                            paystackAccountName={payoutAccountName}
                            countryCode="GHS"
                            // onEdit={() => { /* scroll to form / open modal */ }}
                        />
                    )}


                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4 mb-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="bankType"
                                    checked={bankType === "momo"}
                                    onChange={() => { setBankType("momo"); setBankCode(""); setVerifiedName(null); }}
                                    className="accent-primary"
                                />
                                Mobile Money
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="bankType"
                                    checked={bankType === "bank"}
                                    onChange={() => { setBankType("bank"); setBankCode(""); setVerifiedName(null); }}
                                    className="accent-primary"
                                />
                                Bank Account
                            </label>
                            <div className="flex items-center gap-2 text-sm">
                                <label htmlFor="country-combobox">Country:</label>
                                <div className="min-w-45">
                                    <Combobox
                                        options={countryOptions}
                                        value={country}
                                        onChange={(val) => setCountry(val)}
                                        placeholder="Select country"
                                        disabled={isLoadingNetworks}
                                        className=""
                                    />
                                    <></>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="network-combobox">{bankType === "momo" ? "Network" : "Bank"}</Label>
                                <Combobox
                                    options={networkOptions}
                                    value={bankCode || organization.paystackBankCode || "gggg"}
                                    onChange={setBankCode}
                                    disabled={isLoadingNetworks}
                                    className=""
                                    placeholder={(() => {
                                        if (isLoadingNetworks) return "Loading...";
                                        return bankType === "momo" ? "Select network" : "Select bank";
                                    })()}
                                />

                            </div>
                            <div className="space-y-2">
                                <Label>Account Number</Label>
                                <Input
                                    value={accountNumber}
                                    onChange={(e) => {
                                        setAccountNumber(e.target.value.replaceAll(/\D/g, ""));
                                        setVerifiedName(null);
                                    }}
                                    placeholder={bankType === "momo" ? "0240000000" : "Enter account number"}
                                />
                                <></>

                                {verifiedName && (
                                    <p className="text-sm text-tertiary-600 font-medium flex items-center mt-2">
                                        <Check className="h-4 w-4 mr-1" />
                                        Verified Name: {verifiedName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4 border-t px-6 py-4 bg-muted/20">
                    {verifiedName ? (
                        <div className="flex w-full justify-end items-center">
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={isPending}
                            >
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Payout Details
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleVerify}
                            disabled={isVerifying || !accountNumber || !bankCode}
                        >
                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify Account
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}