export interface PaystackBank {
    id: number;
    name: string;
    slug: string;
    code: string;
    longcode: string;
    gateway: string | null;
    pay_with_bank: boolean;
    supports_transfer: boolean;
    available_for_direct_debit: boolean;
    active: boolean;
    country: string;
    currency: string;
    type: string;
    is_deleted: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface FetchPaystackBanksResult {
    banks: PaystackBank[];
    momo: PaystackBank[];
}

export async function fetchPaystackBanks(currency: string = "GHS"): Promise<FetchPaystackBanksResult> {
    if (!["NGN", "USD", "GHS", "KES"].includes(currency)) {
        throw new Error("Invalid currency. Use one of: NGN, USD, GHS, KES");
    }

    const banksUrl = `https://api.paystack.co/bank?currency=${currency}`;
    const response = await fetch(banksUrl, { method: "GET" });
    const result = await response.json();

    if (!result.status) {
        throw new Error(result.message || "Could not fetch banks.");
    }

    const banks: PaystackBank[] = result.data.filter((b: PaystackBank) => b.type !== "mobile_money");
    const momo: PaystackBank[] = result.data.filter((b: PaystackBank) => b.type === "mobile_money");

    return { banks, momo };
}