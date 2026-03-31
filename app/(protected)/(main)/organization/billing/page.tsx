import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProfilePaymentInfo } from "@/lib/actions/payment";
import { PaymentPlanSettings } from "@/components/event/PaymentPlanSettings";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Billing & Payments",
    description: "Manage your pricing plan, view fees, and purchase communication credits.",
};

export default async function BillingPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const paymentInfo = await getProfilePaymentInfo(user.id);

    return (
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tight">
                    Billing & Payments
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage your pricing plan, view service fees, and track communication credits.
                </p>
            </div>

            <PaymentPlanSettings
                communicationCredits={Number(paymentInfo?.communicationCredits ?? 0)}
                isVerifiedPartner={paymentInfo?.isVerifiedPartner ?? false}
            />
        </div>
    );
}
