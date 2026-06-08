# Bela — Ordering for Others

## What This Is

A user can place a grocery order for someone else — a grandparent who does not have a smartphone, a family member in another neighborhood, a friend who is sick and cannot shop. The sender pays with their own saved payment method through the normal PaymentIntent manual-capture flow. The delivery goes to the recipient's address. The AI uses the recipient's dietary constraints to ensure the right products are bought.

This is the most emotionally powerful use case in the product. It is also the most naturally viral: a user who receives groceries without expecting them will ask "how did this work?" The answer is a live demonstration of what Brioela does.

---

## Two Recipient Scenarios

### Scenario A: The Recipient Has a Brioela Account

If the recipient has their own Brioela account:

1. The sender taps "Order for someone else" in the order creation flow
2. They search for the recipient by phone number or name (from their contacts if permission granted)
3. If the recipient has a Brioela account linked to that phone number, they appear as a connected recipient
4. The sender selects them
5. The order uses the **recipient's constraint profile** (not the sender's) for scanner enforcement
6. The delivery address defaults to the recipient's registered home address (can be changed by the sender)
7. The recipient is not charged — only the sender's payment method is authorized and captured

This is the correct model: grandma's allergies travel with her groceries even when her grandchild is paying for them.

**What the recipient sees**: a push notification at order placement: "[Sender name] is sending you groceries — delivery [date and time]." If they have the app, they can watch the live scan session. If they have the app open when delivery is confirmed, they see: "Your groceries have arrived — sent by [sender]."

### Scenario B: The Recipient Does Not Have a Brioela Account

If the recipient does not have Brioela:

1. The sender taps "Order for someone else — they don't use Brioela"
2. They enter:
   - The recipient's name
   - The delivery address
   - A phone number for the shopper to contact if they cannot find the building (optional but recommended)
3. The sender fills in a simplified constraint form — once, saved for future orders for this recipient:

```
Tell us about [recipient name]'s dietary needs

Allergies (cannot eat): [ text field — "peanuts, sesame" ]
Dietary identity:  [ Vegetarian ]  [ Vegan ]  [ Halal ]  [ None ]
Brands to avoid:   [ text field — optional ]
Notes for the shopper: [ text field — "she likes the larger bags, prefers fresh produce" ]
```

This form is the ONLY place in Brioela where the user fills in a dietary profile manually. It is allowed here because there is no behavioral history to learn from — the recipient has no account, no scan history, no memory events. The AI cannot infer what it has never seen.

4. A `recipient_profile` is stored in the sender's Brain DO SQLite — not in Supabase. It is private to the sender. The sender manages it; it is never shared with Brioela's backend beyond what is needed to run the order.

**What the recipient receives**: an SMS from Brioela (not the sender): "Your groceries from [Sender first name] are on the way — delivery expected [time]." No app required.

---

## The Recipient Profile

For non-Brioela recipients, the `recipient_profile` is stored in the sender's Brain DO:

```sql
CREATE TABLE recipient_profile (
  id           TEXT PRIMARY KEY,   -- UUID
  nickname     TEXT NOT NULL,      -- "Grandma Tigist", "Mom", "Yonas"
  phone        TEXT,               -- for shopper contact on delivery, optional
  address_json TEXT NOT NULL,      -- delivery address as JSON
  constraints_json TEXT,           -- simplified constraint form data as JSON
  notes        TEXT,               -- free-form shopper notes
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
)
```

This table lives in the sender's Brain DO SQLite — not Supabase — because this is personal data the sender manages, not platform data.

---

## The Charitable Pantry Order

The most emotionally powerful use case is ordering for an elderly relative who can no longer easily shop for themselves.

**The scenario**: Kibru's grandmother Woinshet is 78. She lives alone. She cannot easily get to the market. Kibru sets up a weekly standing order for her:

- Standing order: every Thursday
- Delivery: Woinshet's address
- Constraint profile: Woinshet is diabetic, avoids high-sugar products, prefers traditional Ethiopian staples
- Payment: from Kibru's saved payment method
- Contact number: Woinshet's phone (a neighbor's number, as she does not have a smartphone)

Every Thursday, the AI generates a list based on the recipient profile notes ("She typically needs: injera, vegetables, lentils, cooking oil, spices"). Kibru gets the approval notification Thursday morning, glances at it, taps Confirm. By Thursday afternoon, a KYC-verified shopper brings Woinshet's groceries to her door.

Woinshet does not know what Brioela is. She just knows her grandchild sends her groceries every week.

This is the feature that makes family members tell other family members about Brioela. It is an act of care, made effortless by technology.

---

## Multi-Recipient Management

A sender can have multiple saved recipients. From the "Order for others" screen:

```
Who are you ordering for?

  [ Myself ]
  [ Grandma Woinshet — Goro neighborhood ] 
  [ Yonas — Bole neighborhood ]
  [ + Add someone new ]
```

Each recipient has their own:
- Saved delivery address
- Constraint profile (if not on Brioela)
- Order history (what was ordered for them, when, by which shopper)
- Standing order configuration (optional)

---

## Linked Family Account

If the recipient is on Brioela and the sender wants to permanently share a trust relationship (e.g., a parent and adult child who order for each other), they can link accounts as a family group.

Linked accounts:
- Can see each other's saved addresses (with permission)
- Can order for each other without going through the "search by phone" flow each time
- Can pay for selected recipients using sender-owned payment methods

Linking requires mutual consent: both parties must accept the link request. Unlinking is immediate and unilateral (either party can unlink without the other's consent — this is a safety requirement).

Family account linking is stored in Supabase `family_links` table, not in the individual Brain DO, because the link is a relationship between two accounts rather than a fact about one user.

---

## Privacy Between Sender and Recipient

The sender cannot see:
- The recipient's full constraint profile if they are a Brioela user (the scanner uses it; the sender does not read it directly)
- The recipient's scan history or conversation history

The recipient can see:
- That an order is coming (notification)
- Who sent it (the sender's first name only)
- What items are in the order (shown in the delivery notification)

The recipient cannot see:
- What the sender paid
- The sender's payment method status
- The shopper's full route

The shopper can see:
- The delivery address
- The contact phone number (for access issues at delivery)
- The constraint profile enforcement (scanner blocks/warnings apply from the recipient's profile)

The shopper cannot see:
- Who sent the order
- That this is for someone other than the account holder
- Any financial information
