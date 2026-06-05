# Bela — Dispute Resolution

## Why Disputes Need a Proper System

A grocery delivery dispute is different from most digital disputes. The evidence exists on both sides:
- The shopper has a delivery photo
- The live scan session logged every product scan
- The order item list shows what was expected
- The constraint snapshot shows what was blocked

This is not a "he said / she said" situation. The audit trail is complete. Disputes in Brioela should be resolvable automatically for the majority of cases because the evidence is already in the system.

---

## Dispute Window

The user has **30 minutes after delivery confirmation** to raise a dispute. After 30 minutes, the order is finalized and no dispute can be opened.

This window starts from whichever happens first:
- The user taps "Confirm receipt"
- The 10-minute auto-confirm window expires

If auto-confirm triggered (user did not respond), the dispute window still starts from auto-confirm time — not from when the user next opens the app. Users who want to dispute must open the app within 30 minutes of delivery.

---

## Dispute Types

### Type 1: Wrong Item

The user received a product they did not order and did not approve as a substitution.

**Evidence automatically available:**
- The scan session log: was this product scanned during the order? If yes, was it a substitution that the user declined or that was never shown to them for approval?
- The delivery photo: does the product appear in the delivery photo?

**Automatic resolution:**
- If the scan session log shows the item was never scanned (shopper added it without scanning): **automatic refund for that item, full item price**
- If the item was scanned and shown as a substitution that the user declined: **automatic refund**
- If the item was scanned and a substitution was auto-approved (user did not respond in 90 seconds): **refund offered but flagged as shopper ambiguity — quality score impact for shopper**

### Type 2: Missing Item

The user did not receive an item that was marked as delivered.

**Evidence automatically available:**
- The scan session log: was this item scanned during the shopping session?
- The delivery photo: is the item visible in the photo?
- The `order_items` final status: was this item marked as `found` or `unavailable` by the shopper?

**Automatic resolution:**
- If the item was marked `unavailable` by the shopper and the user was notified: **no refund** (expected — item was disclosed as unavailable)
- If the item was marked `found` in the order but is not in the delivery photo and was not scanned: **automatic refund, full item price, shopper quality penalty**
- If the item was scanned but missing from delivery photo: flagged for manual review — most likely a shopper pick-up error at the store

### Type 3: Constraint Violation

The user received a product that violates their dietary constraints — a product the scanner should have blocked.

This is the most serious dispute type. A constraint violation means either:
- The scanner failed to catch a violation (product not in database, matching error)
- The shopper found a workaround (scanned a different product and swapped)
- The shopper delivered a product without scanning it

**Evidence automatically available:**
- The constraint snapshot for this order
- The scan session log (every scan logged)
- Ingredient list of the delivered product (if in the database)

**Resolution:**
- **Automatic full order refund** if the constraint violation is confirmed from the scan log
- Shopper receives an immediate `suspended` status pending review
- A Brioela operations team member reviews the case within 24 hours
- If the violation was a database failure (product not indexed, synonym not covered): the product database is updated, the product is flagged, and the issue is escalated to the product data team

This is the case where the platform must be on the user's side immediately and unconditionally. A constraint violation is a health incident, not a customer service complaint.

### Type 4: Quality Issue — Damaged or Spoiled

The delivered product was damaged, spoiled, or not of acceptable quality.

**Evidence:** the user submits a photo at dispute time. This is the one dispute type that requires user-generated evidence because damage to produce or sealed products cannot be reliably detected from the scan session or delivery photo alone.

**Resolution:**
- The photo is reviewed by a brief AI classification pass: does the image show a clearly damaged or spoiled product?
- If AI confirms damage: **automatic partial refund for the specific item**
- If AI cannot confirm: manual review within 4 hours
- Repeated quality disputes about produce at a specific store update the store's `map_place_signal.community_score` downward

---

## Dispute Flow for the User

When the user taps "Problem with my order":

1. Select dispute type (from a short list — no free-form text required)
2. Select the specific item(s) affected (from their order list)
3. For quality issues: take or upload a photo (required for type 4 only)
4. Tap "Submit dispute"

No phone call. No customer service chat. The system resolves most disputes automatically within 2 minutes.

**The user sees:**

```
Dispute submitted

We're reviewing your order now.

Most disputes are resolved automatically.
We'll notify you within 5 minutes.

[ View dispute status ]
```

For auto-resolved disputes (types 1, 2, 3 in clear-cut cases):

```
Dispute resolved ✓

[Item name] was not delivered as expected.
$4.80 has been returned to your wallet.

Your wallet balance: $27.40
```

---

## Shopper Impact

Disputes impact the shopper's quality score (`06-shopper-quality.md`) as follows:

| Dispute type | Outcome | Shopper quality impact |
|---|---|---|
| Wrong item — shopper error | Refunded | -2 points on item accuracy score |
| Wrong item — substitution confusion | Refunded | -1 point (ambiguity) |
| Missing item — shopper error | Refunded | -3 points |
| Missing item — unavailability disclosed | No refund | No impact |
| Constraint violation confirmed | Full refund + suspension | Investigation; suspension + score reset |
| Quality issue — confirmed | Partial refund | -1 point on delivery accuracy |
| Quality issue — not confirmed | No refund | No impact |

Shoppers can see their dispute history in the shopper earnings screen. Each resolved dispute shows the outcome and the quality score impact. Shoppers cannot contest automatically resolved disputes, but can submit an appeal for manually reviewed cases within 72 hours.

---

## Fraud Prevention

The dispute system is designed to prevent users from claiming refunds for items they actually received.

Protections:
1. **Delivery photo**: the shopper's delivery photo is attached to every order. If the disputed item is clearly visible in the photo, the dispute is automatically rejected.
2. **Scan session log**: every product scanned by the shopper is logged with a timestamp. If the user claims an item is missing but the scan session shows it was scanned and checked off, the dispute is flagged for manual review (not auto-rejected — scan and delivery are different; scan at the store ≠ delivery at the door).
3. **Dispute frequency tracking**: users who dispute more than 30% of their orders in a 90-day window are flagged for manual review. Habitual fraudulent disputers can have their dispute window shortened or their account suspended.
4. **Item value limits**: disputes for high-value items (over $30 per item) always require manual review, regardless of the scan log result.

---

## Manual Review Cases

Cases that cannot be automatically resolved go to the Brioela operations team:

- Quality disputes where the user photo does not clearly show damage
- Missing item disputes where the scan log shows the item was scanned but the delivery photo is ambiguous
- Any constraint violation case (always manual, regardless of automatic initial response)
- High-value item disputes
- Any case where the shopper has filed an appeal

Manual review target: resolved within 4 hours. The user is notified when manual review is needed and given an estimated resolution time.

During manual review, the escrow is held if the order payment has not been finalized. If the order was already completed and the dispute window opened after payment, the refund comes from Brioela's dispute reserve (a separate Stripe balance maintained by the platform for this purpose).
