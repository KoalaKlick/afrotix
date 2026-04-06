"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Minus,
  Phone,
  Plus,
  Ticket,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePaystack } from "@/hooks/usePaystack";

interface PublicTicketPaymentModalProps {
  readonly ticket: {
    readonly id: string;
    readonly name: string;
    readonly price: number;
    readonly currency: string;
    readonly status: string;
    readonly maxPerOrder?: number;
    readonly minPerOrder?: number;
  } | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly event: {
    readonly id: string;
    readonly title: string;
    readonly organizationId: string;
  };
  readonly routing: {
    readonly orgSlug: string;
    readonly eventSlug: string;
  };
}

type ModalStep = "checkout" | "processing" | "success" | "error";

export function PublicTicketPaymentModal({
  ticket,
  open,
  onOpenChange,
  event,
  routing,
}: PublicTicketPaymentModalProps) {
  const router = useRouter();
  const { resumeTransaction } = usePaystack();

  const [step, setStep] = useState<ModalStep>("checkout");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const resetModal = useCallback(() => {
    setStep("checkout");
    setQuantity(1);
    setBuyerName("");
    setPhone("");
    setEmail("");
    setLoading(false);
    setErrorMsg("");
  }, []);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetModal();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetModal],
  );

  if (!ticket) return null;
  const selectedTicket = ticket;

  const minPerOrder = Math.max(selectedTicket.minPerOrder || 1, 1);
  const maxPerOrder = Math.max(selectedTicket.maxPerOrder || 10, minPerOrder);
  const totalAmount = Number(selectedTicket.price) * quantity;

  async function handleSubmitPayment() {
    if (!buyerName.trim() || !phone.trim() || !email.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const callbackUrl = `${
        process.env.NEXT_PUBLIC_DOMAIN_URL || window.location.origin
      }/payment/callback`;

      const responsePhone = phone.startsWith("0")
        ? `233${phone.slice(1)}`
        : phone.startsWith("+")
          ? phone.slice(1)
          : phone;

      const localPhone = phone.startsWith("233")
        ? `0${phone.slice(3)}`
        : phone.startsWith("+233")
          ? `0${phone.slice(4)}`
          : phone;

      const { data: response, error } = await supabase.functions.invoke(
        "initiate-payment",
        {
          body: {
            amount: totalAmount,
            email,
            phone: localPhone,
            currency: selectedTicket.currency || "GHS",
            purpose: "ticket",
            relatedType: "ticket",
            relatedId: selectedTicket.id,
            organizationId: event.organizationId,
            metadata: {
              event_id: event.id,
              ticket_type_id: selectedTicket.id,
              ticket_type_name: selectedTicket.name,
              buyer_name: buyerName.trim(),
              buyer_phone: `+${responsePhone}`,
              buyer_email: email.trim(),
              quantity,
              callback_url: callbackUrl,
              org_slug: routing.orgSlug,
              event_slug: routing.eventSlug,
              source_path: `/${routing.orgSlug}/event/${routing.eventSlug}`,
              notify_via_email: true,
              notify_via_sms: true,
              ticket_delivery_mode: "url",
              qr_format: "svg",
              qr_error_correction: "Q",
            },
          },
        },
      );

      if (error) {
        throw new Error(
          (error as any).message ||
            (error as any).detail ||
            "Payment initialization failed",
        );
      }

      if (!response?.accessCode) {
        throw new Error(response?.error || "Failed to initialize payment");
      }

      setStep("processing");

      resumeTransaction(response.accessCode, {
        phone: localPhone,
        onSuccess: () => {
          router.push(`/payment/callback?reference=${response.reference}`);
        },
        onCancel: () => {
          setLoading(false);
          setStep("checkout");
        },
      });
    } catch (error: any) {
      setErrorMsg(error.message || "Something went wrong.");
      setStep("error");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={false}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Purchase {selectedTicket.name}
          </DialogTitle>
        </DialogHeader>

        {step === "checkout" && (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <Ticket className="size-3.5" />
                Order Summary
              </div>
              <p className="mt-2 text-lg font-black">{selectedTicket.name}</p>
              <p className="text-sm text-muted-foreground">{event.title}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Unit Price
                </span>
                <span className="font-bold">
                  {selectedTicket.price === 0
                    ? "Free"
                    : new Intl.NumberFormat("en-GH", {
                        style: "currency",
                        currency: selectedTicket.currency,
                      }).format(selectedTicket.price)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    setQuantity((current) => Math.max(minPerOrder, current - 1))
                  }
                  disabled={quantity <= minPerOrder}
                >
                  <Minus className="size-4" />
                </Button>
                <div className="flex-1 rounded-xl border px-4 py-2 text-center font-black">
                  {quantity}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    setQuantity((current) => Math.min(maxPerOrder, current + 1))
                  }
                  disabled={quantity >= maxPerOrder}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyerName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="buyerName"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="pl-10"
                    placeholder="Enter buyer name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerEmail">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="buyerEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerPhone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="buyerPhone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    placeholder="0551234567"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <Calendar className="size-3.5" />
                Total
              </div>
              <p className="mt-2 text-3xl font-black">
                {totalAmount === 0
                  ? "Free"
                  : new Intl.NumberFormat("en-GH", {
                      style: "currency",
                       currency: selectedTicket.currency,
                     }).format(totalAmount)}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="size-3.5" />
                Payment secured by Paystack. Ticket delivery will use the
                entered email and phone after confirmation.
              </p>
            </div>

            <Button
              variant="afro-cta"
              size="lg"
              className="w-full"
              disabled={
                loading ||
                selectedTicket.status !== "available" ||
                !buyerName.trim() ||
                !email.trim() ||
                !phone.trim()
              }
              onClick={handleSubmitPayment}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Opening checkout...
                </>
              ) : (
                <>
                  <Ticket className="size-4" />
                  Purchase Ticket
                </>
              )}
            </Button>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Loader2 className="mb-4 size-10 animate-spin text-primary" />
            <p className="text-lg font-black">Opening checkout...</p>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-5 py-4 text-center">
            <XCircle className="mx-auto size-12 text-destructive" />
            <div>
              <p className="text-lg font-black">Payment Error</p>
              <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setStep("checkout")}
            >
              Try Again
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-5 py-4 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <p className="text-lg font-black">Payment Confirmed</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
