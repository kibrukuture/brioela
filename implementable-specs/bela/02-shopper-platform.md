# Bela — Shopper Platform

## Who a Shopper Is

A Brioela shopper is an independent gig worker who:
- Has passed identity verification and criminal background check
- Has a linked bank account via Stripe Connect for payouts
- Operates in a city where Brioela has active users
- Chooses their own hours by toggling availability on/off

Shoppers are not employees. They are independent contractors. Brioela provides the platform, the orders, and the scanner tool. The shopper provides the labor and transport.

---

## Shopper Onboarding Flow

Onboarding is fully in-app. The shopper applies, completes verification, and begins accepting orders — all from the same device.

### Step 1: Application

The shopper opens the Brioela app and selects "Become a shopper" from the main menu. They provide:
- Full legal name
- Date of birth
- City they intend to shop in
- Phone number (verified via OTP)
- Email address

No resume. No interview. No manual review. Everything that matters is verified automatically.

### Step 2: Identity Verification (KYC)

Brioela integrates with **Veriff** (or equivalent: Persona, Stripe Identity) for identity verification.

The shopper:
1. Takes a photo of their government-issued ID (front and back)
2. Takes a selfie with live detection (proves the person holding the ID is present)
3. Veriff runs automated ID authenticity check + face match

Result in under 2 minutes for most cases. Edge cases (unusual IDs, low-light selfies) go to Veriff's human review queue — result within 24 hours.

Possible outcomes:
- `verified` → proceed to background check
- `review_pending` → user waits, notified when resolved
- `rejected` → reason given (expired ID, mismatch detected), can re-apply in 30 days

The Veriff session ID and result are stored in the Brioela backend. The raw ID photos are never stored by Brioela — Veriff stores them per their data retention policy.

### Step 3: Criminal Background Check

After identity is verified, a background check runs automatically via the same KYC provider (Veriff background check, or a dedicated provider like Checkr depending on country).

What is checked:
- Criminal history (violent crime, theft, fraud)
- Sex offender registry
- Sanctions and watchlists

The shopper is shown a disclosure and consent screen before the check runs. This is a legal requirement in most jurisdictions.

Result:
- `clear` → proceed to Stripe Connect setup
- `consider` → requires manual review by Brioela operations team (edge cases: old minor offense, expunged record)
- `suspended` → shopper cannot apply again (serious offense)

The background check result is stored as a binary flag in the `shoppers` table: `background_clear: boolean`. The full report is never stored by Brioela — it is stored by the background check provider and accessible via their dashboard for operations review.

### Step 4: Stripe Connect — Express Account

The shopper links a bank account for payouts via **Stripe Connect Express**.

The shopper completes the Stripe Connect onboarding flow embedded in the app:
1. Provide bank account details (account number + routing/IBAN)
2. Confirm identity (Stripe may ask for additional verification)
3. Accept Stripe's terms of service

Brioela never sees or stores raw bank account details. Stripe handles all of this. The only thing stored in the Brioela `shoppers` table is the Stripe Connect `account_id` — used to trigger payouts.

### Step 5: Shopper Profile Activated

After all three verification steps complete:
- `shoppers.status` → `active`
- The shopper receives a push notification: "You're approved — you can start accepting orders now."
- The shopper app mode is unlocked in their existing Brioela app

The shopper does not need a separate app. The shopper mode is a role-gated view within the same Brioela app.

---

## Shopper App Mode

The shopper app mode is accessible from a toggle in the main menu: "Switch to Shopper Mode." It is only visible to users with `shoppers.status = 'active'`.

### Shopper Mode Home Screen

Shows:
- **Availability toggle** — "I'm available" / "I'm not available" — large, prominent, one tap. When off, no orders are sent to this shopper.
- **Active order** (if any) — the current order they accepted, with status and the next action needed
- **Pending orders nearby** — incoming order requests in their area, each showing: estimated earnings, item count, delivery distance, delivery window
- **Today's earnings** — total payout for completed orders today

### Accepting an Order

When a pending order appears, the shopper sees:
- Number of items
- Estimated shopping time
- Delivery address (neighborhood-level only — full address revealed after accepting)
- Estimated earnings (fixed amount or tiered by item count — see `05-escrow-payment.md`)
- Delivery window the user expects

The shopper has 90 seconds to accept before the order moves to the next available shopper. If they decline, it does not affect their quality score (they can decline freely).

### Shopping Mode

After accepting an order, the shopper enters shopping mode:
- Full item list visible with quantities and any user notes
- Store route (from smart routing — `08-smart-routing.md`) shown on a map
- Scanner button prominent — one tap to open the scanner and scan a product against the order

When the shopper scans a product:
- The product is resolved against the order item list
- The user's constraint check runs immediately
- Result appears on the shopper's screen AND the user's screen simultaneously (live scan session)
- If green: item is checked off the list
- If red: scanner shows exactly why ("Contains sesame — user has sesame allergy. Do not purchase.")
- If orange: scanner shows a substitution warning ("This brand was not on the user's scan history — proceed or find the preferred brand?")

### Delivery Mode

After shopping is complete:
- The shopper taps "Shopping done — heading to delivery"
- Status updates to `in_transit`
- The shopper takes a required photo of all items before leaving the store (proof of delivery contents)
- Photo is uploaded to Cloudflare R2
- The shopper navigates to the delivery address (opens native maps app via deep link with the address)

At the door:
- The shopper taps "I've arrived"
- User receives a notification: "Your shopper is here"
- Shopper hands over items, taps "Order delivered"
- Status updates to `delivered`
- User has 10 minutes to confirm receipt or dispute

---

## Shopper Availability and Coverage

Shoppers set their availability per city. A shopper can be available in one city at a time. They toggle on when they are ready to work and off when they stop.

When a shopper is available:
- They are included in the order dispatch pool for their city
- Orders are dispatched to the nearest available shopper first (based on the shopper's last known location — updated when they toggle availability on)
- The shopper's location is only used for dispatch. It is not displayed to users. It is not stored after the shopper toggles availability off.

---

## Shopper Suspension

A shopper can be suspended automatically or manually:

**Automatic suspension triggers:**
- 3 or more scanner overrides in a single order (overriding a hard constraint block)
- 2 confirmed disputes from separate users within 30 days (missing items, wrong items)
- KYC re-verification failure (if Brioela triggers a periodic re-check and it fails)
- Background check disqualifying event reported by the check provider

**Manual suspension:**
- Brioela operations team review (for `consider` background check results or user-reported safety concerns)

Suspended shoppers are notified with a reason and a contact email for appeals. Their pending payout for completed orders is not affected by suspension.
