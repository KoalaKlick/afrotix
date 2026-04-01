export type TicketStatus =
  | "available"
  | "sold_out"
  | "hidden"
  | "expired"
  | "cancelled";

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantityTotal: number | null;
  quantitySold: number;
  salesStart: string | null;
  salesEnd: string | null;
  maxPerOrder: number;
  minPerOrder: number;
  status: TicketStatus;
  color?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  orderIdx: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketOrder {
  id: string;
  eventId: string;
  buyerId: string | null;
  orderNumber: string;
  buyerName: string | null;
  buyerPhone: string | null;
  subtotal: number;
  discountAmount: number;
  fees: number;
  paymentId: string | null;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  ticketCode: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  checkInStatus: "not_checked_in" | "checked_in" | "cancelled";
  checkedInAt: string | null;
  checkedInBy: string | null;
  smsSent: boolean;
  whatsappSent: boolean;
  createdAt: string;
  updatedAt: string;
}
