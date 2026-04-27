# Afrotix User Roles & Documentation

This document outlines the different types of users and roles within the Afrotix system.

## 1. Regular Users (Profile)
Every registered user in the system has a **Profile**. This is the base identity for everyone.

- **Capabilities**:
  - Purchase tickets for events.
  - Vote in internal and general voting events.
  - Manage their personal wallet.
  - View their ticket history and orders.
  - Opt-in to WhatsApp communications.
- **Key Fields**:
  - `email`: Unique identifier (linked to Auth).
  - `momoNumber` & `momoNetwork`: Mobile money details for payouts/purchases.
  - `communicationCredits`: Balance for messaging/notifications.

## 2. Promoters
Promoters are users who participate in the referral system to earn commissions.

- **Capabilities**:
  - Share unique referral codes.
  - Earn commissions on signups, ticket purchases, and votes.
  - Track earnings (Pending vs. Total).
  - Move up through **Promoter Tiers** (e.g., Gold Tier) based on performance.
- **Statuses**:
  - `pending`: Waiting for approval.
  - `active`: Can actively refer and earn.
  - `suspended`: Temporarily restricted.
  - `inactive`: No longer participating.

## 3. Organizations
Organizations are the entities that create and manage events. A user can be a member of one or more organizations.

### Organization Roles
Within an organization, users are assigned specific roles:

| Role | Description |
| :--- | :--- |
| **Owner** | The creator of the organization. Has full control, including billing and deletion. |
| **Admin** | Can manage events, members, and organization settings. |
| **Member** | Typically has access to view and manage specific event tasks as assigned. |

- **Capabilities**:
  - Create and publish events (Voting, Ticketed, Hybrid).
  - Manage subaccounts for automated split payments (Paystack).
  - Customize organization branding (Logo, Colors, Banner).
  - Invite other users to join the organization.

## 4. Verified Partners
The `isVerifiedPartner` flag on a Profile indicates a trusted user or entity.

- **Capabilities**:
  - Often granted to established event organizers or corporate partners.
  - May have access to lower commission rates or premium support.
  - Verified badge visible on public profiles/events (depending on UI implementation).

## 5. Membership Requests & Invitations
- **Invitations**: Organizations can invite users via email.
- **Requests**: Users can request to join an organization, which must be approved by an Admin/Owner.

---

*Last Updated: April 27, 2026*
