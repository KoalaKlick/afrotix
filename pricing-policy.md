# Sankofa Platform Pricing & Referral Policy

This document outlines the core pricing tracks, communication costs, and referral incentives for the Sankofa platform.

---

## 1. Core Pricing Plans
Platform uses two primary tracks to balance flexibility and predictability. Pricing applies to both **Tickets** and **Votes**.

| Feature | Essential (Pay-As-You-Go) | Professional (Fixed Plan) |
| :--- | :--- | :--- |
| **Subscription** | 0 GHS / month | 500 GHS / month |
| **Service Fee** | 3.5% + 10 GHS per unit (Ticket/Vote) | 1.5% + 5 GHS per unit (Ticket/Vote) |
| **Free Events** | Always Free | Always Free |
| **Payouts** | Standard (3-5 days) | Instant Payouts available |
| **Best For** | One-off events or small meetups | Recurring events and festivals |

*Note: For votes, the service fee applies to each voting transaction.*

---

## 2. Communications & Verification Policy
SMS and WhatsApp costs are treated as add-on utility credits.

- **Utility Credits**: Organizers purchase "Communication Bundles" (e.g., 100 GHS for 1,000 credits).
- **WhatsApp OTP/Notification**: 1.5 Credits per message.
- **SMS OTP/Notification**: 1 Credit per message.
- **In-App/Email**: Always Free.

---

## 3. Referral & Growth Policy
Referral incentives are funded by the Platform Service Fee.

### For the Referrer (The "Ambassador")
- **Standard Reward**: 10% of the Platform's service fee collected from the referred organizer’s first 3 events.
- **Gold Tier**: Reward increases to **15%** + "Verified Partner" status.
- **Gold Eligibility**: Based on both a target number of successful referrals AND a minimum threshold of generated revenue (Algorithm TBD).

### For the Organizer (The "New User")
- **Benefit**: 500 Free WhatsApp/SMS Credits OR 0.5% discount on platform service fee (first month).

---

## 4. Implementation Logic (Technical)

### Service Fee Calculation
```typescript
function calculateServiceFee(plan, amount, type) {
  // Logic covers both 'ticket' and 'vote' transaction types
  const percentage = plan === 'professional' ? 0.015 : 0.035;
  const fixed = plan === 'professional' ? 5 : 10;
  return (amount * percentage) + fixed;
}
```

### Commission Deduction
- Commission is calculated from the **Platform Fee** only.
- It does not reduce the Organizer's revenue.
