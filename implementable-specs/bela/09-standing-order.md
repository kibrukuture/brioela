# Bela — Standing Orders

## What a Standing Order Is

A standing order is a recurring pantry replenishment that runs on a schedule without any action from the user. The AI generates the list, notifies the user for a brief approval window, and then dispatches to a shopper automatically.

The user sets it up once. After that, groceries arrive on schedule. They never open a list screen. They never think about what they are out of. The system thinks about it for them.

---

## Setting Up a Standing Order

The user configures a standing order in the Bela tab:

**Frequency options:**
- Weekly (pick a day: Monday through Sunday)
- Every two weeks
- Monthly

**Delivery window:**
- A preferred time range on the selected day (e.g., "Saturday, 9am–12pm")

**Budget cap:**
- An optional maximum order total
- If the AI-generated list exceeds the cap, items are trimmed by priority (most frequently used items kept; rarely used items dropped from that cycle)

**Wallet minimum:**
- The standing order will not dispatch if PaymentIntent authorization fails for the saved payment method
- The user can update their saved payment method before the scheduled date

That is the entire setup. No list to manage. No items to configure. The AI builds the list each time from what it knows.

---

## How the List Is Generated

The day before the scheduled delivery:

1. **Pantry gap analysis**: the AI reads the pantry model (from the Brain DO: cooking session records, scan history, ingredient usage events) and identifies items that fall below their restock threshold

2. **Restock threshold per item** is learned over time:
   - Items the user scans and uses frequently get tighter thresholds (restock sooner)
   - Items used occasionally get looser thresholds
   - Items that expired or were discarded (detected from conversation or scan) get adjusted thresholds
   - Initial threshold for any item: every 3 weeks (conservative default, tightens as usage pattern becomes clear)

3. **Last restock check**: items that were on the previous standing order AND were confirmed delivered are assumed to be in stock. The AI reduces their gap score accordingly.

4. **Recipe context**: if the user has saved recipes they have not cooked in a while (from `recipes` table: `cooked_at` is old), or if recent cooking sessions referenced an upcoming dish, the ingredients for those recipes are added to the proposed list

5. **Ground signals**: if Ground price data shows a notable price drop for a frequently-bought item at a nearby store today, that item is surfaced prominently even if it is not at a critical low

The generated list is stored in `standing_order_cycles` with `status = 'proposed'`.

---

## The Approval Window

At the configured time the day before delivery, the user receives a notification:

```
Your weekly pantry order is ready

12 items • ~$52 estimated
Delivery tomorrow, Saturday 9am–12pm

[ Review and confirm ]  [ Edit ]  [ Skip this week ]
```

**The approval window is 3 hours.**

During those 3 hours, the user can:
- **Confirm**: order is finalized as-is and dispatched to shoppers at the delivery day morning
- **Edit**: open the order creation screen with the proposed list pre-filled; adjust items, quantities, or notes; then confirm
- **Skip this week**: this cycle is skipped; the next one runs on the normal schedule; no charge

**If no action is taken within 3 hours:**
- The order is auto-confirmed (same as if the user tapped Confirm)
- A notification is sent: "Your standing order was auto-confirmed — delivery tomorrow morning."

The auto-confirm behavior can be toggled off in standing order settings. If turned off: the standing order only dispatches if the user explicitly confirms, and a skipped cycle does not reschedule — the user must re-confirm manually for that delivery week.

---

## The "Never Think About Groceries Again" Scenario

**What this looks like in practice:**

Tigist sets up a weekly standing order on Sunday mornings.

Week 1: She confirms the AI's list — 9 items, $38. Delivered Sunday 10am.
Week 2: The AI notices she used the teff flour and she cooked doro wat (from a cooking session). It adds more teff and adds whole chicken to the list. She gets a notification Saturday evening, glances at it, taps Confirm in 15 seconds. Delivered Sunday morning.
Week 3: She is traveling. She forgot she had a standing order. The app sends the notification, she does not respond for 3 hours. Order auto-confirms. She texts a family member: "There will be groceries arriving Sunday — can you receive them?" Done.
Week 8: The AI notices she has been cooking the same dishes repeatedly. It adds berbere (running low based on usage frequency) and proposes cardamom (a new ingredient referenced in a recipe she saved). She has not thought about groceries in 8 weeks.

This is the ambient operating system from spec 00 applied to purchasing. It does not ask her to manage a list. It manages itself.

---

## Budget Cap Behavior

If the AI-generated list exceeds the budget cap, items are trimmed using a priority score:

```
item_priority = (
  usage_frequency_score × 0.50 +    // how often the user buys this
  pantry_urgency_score  × 0.35 +    // how depleted the pantry model estimates this is
  recipe_link_score     × 0.15      // is this item needed for a saved recipe soon?
)
```

Items below a priority threshold are dropped from the cycle and marked `skipped_this_cycle` — they will be included in the next cycle's list at higher priority.

The user is shown what was dropped:

```
3 items removed to stay within your $50 budget

Removed:
• Cardamom (not urgent — plenty still in pantry)
• Sunflower oil (still available nearby at last check)
• Pasta (low usage this month)

These will be added back next cycle.
```

---

## Cycle History and Editing

Every standing order cycle is stored in `standing_order_cycles` with the full item list, the proposed list, what was edited, and what was delivered. The user can view their cycle history in the app.

From the history view they can:
- See what arrived each week
- Adjust recurring notes per item ("always get the large bag of teff")
- Add items as permanent standing list entries (always include regardless of pantry model)
- Remove items from the standing model (never include again)

Permanent standing list entries override the AI's pantry model — if the user says "always include 2L olive oil every week," that item is on every order regardless of what the pantry model thinks.

---

## Wallet Monitoring for Standing Orders

The day before the delivery, after the list is generated, the system checks whether the saved payment method can authorize the estimated total.

If the balance is insufficient:
1. The user is notified: "Your saved payment method could not authorize this week's order (~$48). Update payment by Saturday morning to keep your standing order on track."
2. If authorization still fails by the morning of the delivery day: the standing order is skipped for that cycle and the user is notified: "Standing order skipped — payment authorization failed. Your next order is scheduled for [next cycle date]."

No funds are ever taken without sufficient balance. No overdraft occurs.
