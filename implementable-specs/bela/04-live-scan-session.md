# Bela — Live Scan-Together Session

## What This Is

When a shopper is in the store, the user can open a shared scanning session. Every product the shopper scans appears on the user's phone simultaneously — the same scan result card, the same health score, the same constraint check result. The user is virtually in the store alongside the shopper.

This is not a video call. The shopper does not need to hold up their phone and stream video. It is a data sync: scan → result appears on both screens at the same millisecond. The user sees exactly what is going into the basket without either side doing anything extra.

---

## Architecture

The live scan session runs through the `OrderAgent` Durable Object.

```
Shopper phone                  OrderAgent DO                  User phone
─────────────────              ──────────────────────         ─────────────────
Scans product   ──────────►   Receives scan payload           
                               Runs product resolution        
                               Runs constraint check          
                               Builds scan result card        
                    ◄──────── Sends result to shopper ──────► Sends result to user
Shopper sees card              (both WebSocket connections)    User sees same card
```

Both phones maintain a WebSocket connection to the `OrderAgent` DO for the duration of the shopping session. The DO broadcasts every scan result to both connections simultaneously.

**OrderAgent DO endpoint:** `/scan-session`

Both shopper and user connect here:
- Shopper connects with role `shopper` and order authentication token
- User connects with role `user` and their session token

The DO verifies both tokens before allowing the connection. A third party cannot join the session.

---

## What the User Sees

### Passive Mode (Default)

The user does not need to actively watch. The live session runs in the background. Their Brioela app shows a subtle persistent banner: "Shopping in progress — 7 of 12 items found."

When the user taps the banner, they open the full live session view:
- A running list of scanned items (most recent at top)
- Each item shows: product name, brand, quantity, scan result (green / orange / yellow / red)
- Red items (constraint blocks) are shown with a warning icon — the user can see what was blocked and why
- Items checked off the order list show in grey with a checkmark
- Items not yet found are shown in a pending state below

The user can dismiss the view and return to any other part of the app. The session continues in the background.

### Active Involvement

The user can interact with any scan result that is still in the shopper's hands (before the shopper has moved to the next product):

**Reject a product:**
Tap "Don't buy this" on any orange-highlighted item (category match, not exact match). The shopper's phone shows: "User said: find the original item. Keep looking." The item is not checked off.

**Approve a substitution:**
If the exact product is out of stock and the shopper has found an alternative, the shopper marks it as a substitution. The user sees: "Shopper found [Alternative Brand] instead of [Original]. Accept?" with Accept / Decline. Auto-accepts after 90 seconds if no response.

**Send a note:**
The user can tap any unchecked order item and send a short note to the shopper: "Any size is fine for this one" or "Skip it if they don't have the large bag." The shopper sees this as an in-app message attached to that item.

**Override a block (user only):**
If a hard block triggered (the scanner refused a product), the user can tap "Buy it anyway" on their screen. This initiates a user-override (see `03-constraint-travel.md`). The shopper's screen immediately shows: "User approved — add to order."

---

## Scan Result Card Format

Every scan result card shown in the live session:

```
┌─────────────────────────────────────────────┐
│  ✅  Teff Flour — Brundo Brand              │
│      1 kg bag                               │
│                                             │
│  Health score: Green                        │
│  Matches order item: ✓ (exact)              │
│  No constraint flags                        │
│                                             │
│  Added to basket                      12:34 │
└─────────────────────────────────────────────┘
```

For a constraint block:
```
┌─────────────────────────────────────────────┐
│  ⛔  Sesame Tahini — Canaan Brand          │
│      200g jar                               │
│                                             │
│  BLOCKED — Contains sesame                  │
│  User allergy: sesame                       │
│                                             │
│  Shopper is finding an alternative    12:41 │
└─────────────────────────────────────────────┘
```

For a substitution:
```
┌─────────────────────────────────────────────┐
│  🟡  Organic Oats — Nature's Path          │
│      500g bag (substitution)                │
│                                             │
│  Original item out of stock                 │
│  This is a similar product                  │
│                                             │
│  Accept?   [ ✓ Accept ]  [ ✗ Decline ]    │
│  Auto-accepts in 78 seconds          12:47 │
└─────────────────────────────────────────────┘
```

---

## Session Lifecycle

### Session Opens

The live scan session is available as soon as the order status changes to `shopping`. The user receives a soft notification (not a push notification — an in-app persistent banner): "Your shopper is now at the store. Tap to watch."

The user does not have to join. Joining is optional. The session runs regardless of whether the user is watching — scan results are stored in `order_events` either way.

### Session Active

While the shopper is scanning:
- The OrderAgent DO maintains both WebSocket connections
- Scan results are broadcast to both in real time (< 200ms from scan to display on user's screen)
- The DO writes each scan result to `order_events` for the dispute trail

If the user's WebSocket disconnects (they close the app, lose signal briefly): scan results that occurred during the gap are delivered in batch when they reconnect, newest first. The user sees a "While you were away" summary.

If the shopper's WebSocket disconnects: the session enters a degraded state. The user sees: "Shopper connection interrupted — results will sync when they reconnect." The shopper can continue scanning; results are queued in the OrderAgent and broadcast when the connection restores.

### Session Ends

When the shopper taps "Shopping done — heading to delivery," the scan session closes. The user sees a summary: "Shopping complete — [X] of [Y] items found. [Z] items unavailable." A tap shows which items were unavailable and offers the user an option to adjust the order total (removing unavailable items from the charge).

---

## Why This Builds Trust

The single biggest complaint about grocery delivery services is: "They got the wrong thing and I couldn't do anything about it."

The live scan session eliminates this complaint. The user cannot be surprised at delivery because they watched every product scan in real time. If something was wrong, they could have said so while the shopper was still in the store.

The user's ability to participate (not just observe) transforms the relationship from "I hired a stranger to shop for me" to "I shopped with someone who did the walking." That is a fundamentally different experience. The shopper is the user's hands in the store, and the user can see through those hands in real time.
