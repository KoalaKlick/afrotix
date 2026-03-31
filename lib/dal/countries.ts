// List of supported countries and their Paystack currency codes
// This can be extended or fetched from a config/service if needed

export const supportedCountries = [
       { name: "Ghana", code: "GH", currency: "GHS" },
 { name: "Nigeria", code: "NG", currency: "NGN" },
    { name: "Kenya", code: "KE", currency: "KES" },
    { name: "United States", code: "US", currency: "USD" },
];

export function getCountryByCode(code: string) {
    return supportedCountries.find(c => c.code === code);
}

export function getCurrencyByCountryCode(code: string) {
    const country = getCountryByCode(code);
    return country ? country.currency : undefined;
}
