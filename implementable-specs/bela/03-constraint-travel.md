# Bela — Constraint Profile Travel

## The Core Safety Claim

When a user places an order, their full constraint profile — every allergy, intolerance, dietary restriction, dislike, and boycott — is attached to the order and enforced in real time on the shopper's scanner. The shopper cannot purchase a product that violates a hard constraint without triggering a visible block. They cannot miss an allergy even if they forget to read the user's notes.

This is the feature no competitor has. It is also the feature that makes Brioela a safety-critical platform for users with life-threatening food allergies.

---

## What Travels with the Order

At order confirmation, the `OrderAgent` DO reads the user's full constraint table from their `Brain DO SQLite` and writes a snapshot to the `order_constraint_snapshot` table in Supabase. This snapshot is used for all constraint checks during the order — it is frozen at order time so that any changes the user makes to their constraints after placing the order do not affect the in-progress shopping.

**What is included in the snapshot:**

```typescript
interface OrderConstraintSnapshot {
  orderId:      string
  capturedAt:   number   // unix ms — when the snapshot was taken

  // Hard blocks — scanner refuses purchase
  hardBlocks: {
    kind:       'allergy' | 'intolerance' | 'boycott'
    entityKind: 'ingredient' | 'brand' | 'place'
    entityValue: string   // e.g. 'sesame', 'peanuts', 'Nestlé', 'dairy'
    reason:     string    // shown to shopper if they try to override
  }[]

  // Soft guidance — scanner warns but does not block
  softGuidance: {
    kind:         'dislike' | 'preference'
    entityKind:   'ingredient' | 'brand' | 'attribute'
    entityValue:  string   // e.g. 'palm oil', 'organic', 'high sodium'
    instruction:  string   // e.g. 'prefer organic when available', 'user dislikes palm oil'
  }[]
}
```

The snapshot is read by the `OrderAgent` DO every time the shopper scans a product. It is not re-fetched from the Brain per scan — it is loaded into the OrderAgent's memory at session start and cached for the duration of the shopping session.

---

## Hard Blocks vs Soft Guidance

### Hard Blocks — Scanner Refuses Purchase

Hard blocks come from the `constraints` table with `kind IN ('allergy', 'intolerance', 'boycott')`.

When a shopper scans a product that matches a hard block:
- The scanner shows a **red card** immediately
- The card shows: the block reason, the specific ingredient or brand that matched, and a note that this cannot be overridden
- The product is NOT added to the order item list
- The event is logged to `order_events` with `kind = 'scanner_block'`

**What the shopper sees (example — sesame allergy):**

```
⛔ DO NOT PURCHASE

Tahini Dip — Great Value Brand

Contains: sesame paste (first ingredient)
User allergy: SESAME — life-threatening

This product cannot be added to this order.
Find a sesame-free alternative.
```

There is no override button for allergies. The block is absolute.

**What the shopper sees (example — brand boycott):**

```
🚫 USER DOES NOT BUY THIS BRAND

Nestlé Milo Chocolate Powder

User has a standing boycott on all Nestlé products.
Please find an alternative brand.

[ I understand — find another ]
```

The boycott block has an acknowledge button but no override. The shopper must find an alternative.

### Soft Guidance — Warnings Without Blocks

Soft guidance comes from `constraints` table with `kind = 'dislike'` and from preference inferences in `user_memory`.

When a shopper scans a product that matches soft guidance:
- The scanner shows an **orange card** below the green health result
- The shopper can proceed
- The event is logged with `kind = 'scanner_soft_warning'`

**What the shopper sees (example — palm oil dislike):**

```
✅ Product looks good

Margarine — Brand X

⚠️  Contains: palm oil
User tends to avoid palm oil.
If there is an alternative without palm oil nearby, the user would prefer it.
Otherwise, this is fine to purchase.

[ Buy this ]  [ Find alternative ]
```

**What the shopper sees (example — organic preference):**

```
✅ Product looks good

Rolled Oats — Store Brand

ℹ️  Organic version may be preferred
User typically chooses organic oats when available within 20% price difference.
This product is not organic. If organic oats are available here, check the price.

[ Buy this ]  [ Check for organic version ]
```

---

## The Override Mechanism

Hard blocks cannot be overridden by the shopper. The UI does not offer an override option.

The only exception: if the user is watching the live scan session and explicitly taps "Buy it anyway" on their own screen. This is an override initiated by the **user**, not the shopper, and it is logged as a `user_override` event. This handles the edge case where the user's constraint database is wrong (they previously had an intolerance that resolved, for example) and they catch it during the live session.

User-initiated overrides:
- Are logged with `kind = 'user_override'` in `order_events`
- Trigger a follow-up after delivery: "You overrode a constraint during your order. Do you want to update your profile for this ingredient?"
- Do NOT count against the shopper's quality score — the user made the call

Shopper-initiated overrides do not exist. If a shopper is physically unable to find a non-blocked alternative, they must remove the item from the order (mark it as "unavailable") and notify the user via in-app message. The item is removed from the order and the estimated total is adjusted.

---

## How Product Ingredient Matching Works

The scanner resolves the scanned product against the product database (`product_profile` table). The `ingredients` field of the matched product profile is an array of normalized ingredient names.

Constraint matching:
```typescript
function checkConstraints(
  product: ProductProfile,
  snapshot: OrderConstraintSnapshot
): ConstraintCheckResult {

  for (const block of snapshot.hardBlocks) {
    if (block.entityKind === 'ingredient') {
      // Check if any ingredient in product matches the blocked ingredient
      const match = product.ingredients.some(ing =>
        normalizedMatch(ing, block.entityValue)
      )
      if (match) return { blocked: true, kind: 'hard', block }
    }

    if (block.entityKind === 'brand') {
      if (normalizedMatch(product.brand, block.entityValue)) {
        return { blocked: true, kind: 'hard', block }
      }
    }
  }

  const warnings: SoftWarning[] = []
  for (const guidance of snapshot.softGuidance) {
    if (guidance.entityKind === 'ingredient') {
      const match = product.ingredients.some(ing =>
        normalizedMatch(ing, guidance.entityValue)
      )
      if (match) warnings.push({ guidance, matched: guidance.entityValue })
    }
    // attribute matching (e.g. 'organic') handled via product_profile.attributes
  }

  return { blocked: false, warnings }
}
```

`normalizedMatch` handles:
- Case insensitive
- Partial match for multi-word ingredients: "sesame" matches "sesame oil", "toasted sesame seeds", "sesame paste"
- Synonyms: "peanut" matches "groundnut", "arachis" (the Latin name used on European labels)

The synonym table is maintained in the product service and is language-aware — it covers ingredient naming conventions in the markets Brioela operates in.

---

## What Happens When Product Is Not in the Database

If the shopper scans a product that does not resolve in the `product_profile` table (a local brand, a product with a damaged barcode, a product not yet indexed):

1. The scanner shows: "Product not in our database — check ingredients manually"
2. The shopper is shown the user's hard block list in plain text: "Check this product does not contain: sesame, peanuts, dairy"
3. The shopper can tap "Ingredients checked — not in user's blocked list" to add it to the order
4. This manual check is logged as `kind = 'unresolved_product_manual_check'` in order_events
5. The scan event is flagged for product database enrichment — a background job will attempt GPT-4o mini vision extraction and classification from the product photo taken by the scanner

Unresolved products are NOT soft-approved automatically. The shopper must manually confirm the check before the product can be added to the order.

---

## Constraint Snapshot and User Privacy

The constraint snapshot stored in Supabase `order_constraint_snapshot` contains the user's dietary restrictions and health information. This is sensitive data.

Privacy rules:
- The snapshot is readable only by the `OrderAgent` DO for this specific order — it is not accessible to the shopper directly (they see the scanner result, not the raw constraint database)
- The snapshot is retained for 90 days after order completion (needed for dispute investigation) then deleted
- The shopper never sees the user's full constraint list in text form — they only see scanner feedback per product, which is the minimum required
- The shopper does not know WHY a block exists (medical, ethical, personal) — only that this product cannot be purchased for this order
