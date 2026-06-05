# Bela — Ground Intelligence Built by Shoppers

## The Side Effect That Makes Ground Dense

Ground's intelligence layer (spec 35) depends on real people scanning real products in real stores and submitting finds. The problem: most users will not go out of their way to contribute. Ground contribution requires intent — opening the app, tapping the dictation button, submitting a find — while already in the middle of grocery shopping.

Shoppers solve this problem as a side effect of their paid work. A shopper who does 5 orders a week scans 40–80 products per order across multiple stores. Every one of those scans is a potential Ground signal. The shopper is already in the store with the scanner open. The contribution cost approaches zero.

---

## Shopper Consent at Onboarding

During the shopper onboarding flow, after KYC is cleared and before the Stripe Connect setup, the shopper sees:

```
Help build the food map

While you're shopping for orders, your product scans can 
automatically contribute to Brioela's live food map — 
anonymously. You'll never be identified.

This includes:
• Price signals when you scan a product
• Product availability at this store
• New products you find that aren't in our database

You can turn this off at any time in your shopper settings.

[ Sounds good — turn it on ]  [ No thanks ]
```

Consent is opt-in, not assumed. It can be toggled in shopper settings at any time. If a shopper turns it off after contributing, their past contributions remain on the map (they are already anonymized and not linked to the shopper identity).

---

## What Gets Auto-Drafted as a Ground Find

Not every scan is a find. The system selects scans that carry real information density.

### Price Signal Find (Green)

**Trigger**: product is scanned and the price (from the order estimate, confirmed by receipt data at order completion) differs from the last known Ground price signal for this product at this location by more than 5%.

**Auto-draft:**
> "[Product name] — [price] at [store name]. [Time ago]."

Examples:
> "Sunflower cooking oil 2L — $3.80 at [store name]. As of this morning."
> "Teff flour 1kg — $4.20 at [market name]. Down from ~$5 last month."

The price is taken from the order's actual receipt data (submitted at completion) — it is the real price, not an estimate.

### Availability Find (Orange)

**Trigger**: product is scanned that has no recent `product_sighting` for this location (last sighting > 7 days ago or never sighted here before).

**Auto-draft:**
> "[Product name] back in stock at [store name]. Seen this morning."

Or for a first sighting at this location:
> "First time seeing [product name] at [store name]."

### New Product Find (Blue)

**Trigger**: scanned product is not in the `product_profile` database at all (unresolved product scan), or is in the database but has been available at this location for less than 14 days (from `product_sighting.first_seen_at`).

**Auto-draft:**
> "New: [product name or category], [brand if known], at [store name]."

### Freshness Signal (Orange with freshness note)

**Trigger**: the shopper manually adds a note to their scanner result for a produce item (the app shows a "Note freshness?" prompt for produce category scans). This is opt-in per produce scan, not automatic.

The shopper taps a freshness rating:
- 🟢 Very fresh (just arrived / clearly new stock)
- 🟡 Fine (normal)
- 🔴 Old (visibly past peak)

If Very fresh or Old is selected, a find is drafted:
> "Fresh [ingredient] just arrived at [market name]. Good quality." 
> OR
> "[Ingredient] at [market name] looked old/past peak today."

This is the one type of find that requires a shopper action (tapping a freshness rating). The prompt appears only for produce-category scans, not packaged goods.

---

## The Auto-Draft Review Flow

After the shopper's shopping session ends (they tap "Shopping done"), if any Ground finds were auto-drafted during the session, a summary appears:

```
3 finds ready to share

These are based on your scans today. 
They're anonymous and help others nearby.

[ Sunflower oil — $3.80 at Merkato Market ] ✓
[ Teff flour — back in stock at Bole Store ] ✓  
[ Fresh tomatoes — very fresh at Shiro Meda ] ✓

[ Share all 3 ]  [ Review each ]  [ Skip ]
```

The shopper can:
- **Share all**: all three are submitted to the authenticity gate simultaneously
- **Review each**: open each draft, edit the text, then submit or skip individually
- **Skip**: no finds submitted from this session

If the shopper selects "Share all" regularly, this behavior is remembered and future sessions auto-submit after a single confirmation tap.

---

## Authenticity Gate — Same Gate, No Shopper Exemption

Shopper-generated finds pass through the exact same AI authenticity gate as user-generated finds (spec 35). No exemption. The gate does not know or care that the find came from a shopper rather than a regular user.

This is intentional: shoppers have the same potential for bias (a shopper who frequently shops at a specific store might unconsciously write more favorable finds for that store). The gate catches promotional language, specificity failures, and personal information regardless of source.

Gate checks for shopper-drafted finds:
- Specificity check: pass (the draft always names a specific product and location — the system pre-fills these)
- No promotion: applied (the AI reformatter strips any phrasing that sounds like endorsement)
- Freshness plausibility: applied (the captured_at timestamp from the scan session is attached — the gate verifies the find matches the date)
- Minimum information density: pass (the draft always contains at least price or availability — the system guarantees this)
- No personal information: applied (the draft never contains names — the AI reformatter removes any that slip through)

Gate pass rate for shopper-generated finds is expected to be higher than user-generated finds (>90% vs the 75–85% target for user finds) because the data structure is more constrained — the system generates the core facts and only the freshness notes are free text.

---

## Volume and Ground Density Impact

**Scenario**: A city has 50 active shoppers, each doing 5 orders per week, each order involving 30 product scans.

```
50 shoppers × 5 orders × 30 scans = 7,500 product scans per week
Eligible for find auto-draft (price change, new sighting, etc.): ~30% = 2,250 drafts
Gate pass rate: ~90% = ~2,025 approved finds per week
Shopper consent opt-in rate (estimated): 70% of shoppers
Active finds from shoppers per week: ~1,418
```

A city with 50 active shoppers generates approximately 200 Ground finds per day. For context: spec 35's success metric is "find density per active city." 200 finds per day across the main markets in a single city creates a genuinely useful Ground map.

This is Ground's cold-start solution. The map does not start sparse and wait for regular users to contribute — the shoppers populate it as an automatic consequence of doing their jobs.

---

## What Shopper Finds Do NOT Include

- Any information about the user whose order the shopper was fulfilling (no connection between the find and the order)
- The shopper's identity (the `contributor_hash` in the `find` table is a hashed version of the shopper's ID, the same privacy model as regular users)
- Pricing information about items that were NOT on the order (the shopper is not browsing the store freely — they only scan items they are purchasing)
- Any find marked as "internal to the order" — if the shopper scanned something and it was blocked by a constraint, that block event is NOT converted to a find (constraint violation information is not shared with Ground)
