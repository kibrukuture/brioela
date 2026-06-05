# Bela — Shopper AI Assistant

## What This Is

When a shopper enters the store to fulfill an order, they get the same AI capability the user gets during a cooking session — but tuned for shopping. The shopper's phone becomes a live AI assistant that can hear them, see through their camera, and talk back in real time.

Scanning is not just scanning. It is a conversation.

The shopper holds up a product and says: "Is this the right one?" The AI has already read the label through the camera and says: "Yes, that's it — but it has palm oil, which the user tries to avoid. There's another brand on the shelf to your left without it. Up to you." The shopper looks left, finds the better option, grabs it.

No one types anything. No one reads a list on a screen. The shopper just talks and walks.

---

## The Technology

Same stack as the cooking session (`cooking-session/03-gemini-session.md`):
- **Model**: Gemini 3.1 Flash Live (`gemini-3.1-flash-live-preview`)
- **Transport**: Cloudflare Realtime SFU for mobile audio + video → OrderAgent DO → Gemini WebSocket
- **Audio out**: Gemini responds in voice to the shopper's earbuds or phone speaker
- **Video in**: shopper's rear camera streams JPEG frames via `client_content` inline_data (same method as cooking session — avoids the 2-minute session cap)
- **Audio in**: PCM from the shopper's microphone via Cloudflare Realtime WebSocket adapter

The OrderAgent DO gains a second Gemini Live session alongside the existing order state machine. The shopper's Gemini session is separate from anything on the user's side — the user's live scan-together session is a data channel; the shopper's AI session is a voice + vision channel.

---

## What the Shopper AI Knows

At the start of the shopping session, the OrderAgent DO builds a system instruction for the shopper's Gemini session from:

1. **The full order item list** — every item the user needs, with quantities and user notes
2. **The constraint snapshot** — every hard block and soft guidance, loaded from `order_constraint_snapshot`
3. **The user's preference notes** — things like "user prefers organic when under 20% price difference," "user always buys the large bag"
4. **The store context** — the store name and location (from the smart routing result), what Ground says about this store today (fresh finds, price signals)
5. **The trust relationship note** — if this shopper has a trust relationship with this user and has written shopper-specific notes ("she prefers the stall at the north entrance"), those are included

The system instruction is built like this:

```typescript
private buildShopperSystemInstruction(
  order: Order,
  snapshot: OrderConstraintSnapshot,
  shopperNotes: string | null,
  groundContext: GroundSignal[],
): string {
  const parts: string[] = []

  // Identity
  parts.push(`You are Brioela's shopping assistant for this order. You help the shopper find the right products, check ingredients, and avoid anything that would harm the customer.`)
  parts.push(`You can see through the shopper's camera and hear them speak. You respond by voice. Be brief — the shopper is moving through a store.`)

  // The order
  parts.push(`\n## ORDER LIST (${order.items.length} items)`)
  for (const item of order.items) {
    parts.push(`- ${item.description}, ${item.quantity}${item.note ? ` — note: "${item.note}"` : ''}`)
  }

  // Hard blocks — the AI must enforce these
  if (snapshot.hardBlocks.length > 0) {
    parts.push(`\n## NEVER ALLOW — HARD BLOCKS`)
    parts.push(`These will seriously harm the customer. Block any product that contains or is made by:`)
    for (const block of snapshot.hardBlocks) {
      parts.push(`- ${block.entityValue} (${block.kind}: ${block.reason})`)
    }
    parts.push(`If you see any of these through the camera or hear the shopper about to buy one, stop them immediately.`)
  }

  // Soft guidance
  if (snapshot.softGuidance.length > 0) {
    parts.push(`\n## PREFERENCES (guide, do not block)`)
    for (const g of snapshot.softGuidance) {
      parts.push(`- ${g.instruction}`)
    }
  }

  // Store context from Ground
  if (groundContext.length > 0) {
    parts.push(`\n## WHAT GROUND SAYS ABOUT THIS STORE TODAY`)
    for (const signal of groundContext) {
      parts.push(`- ${signal.content}`)
    }
  }

  // Shopper-specific knowledge
  if (shopperNotes) {
    parts.push(`\n## YOUR NOTES ON THIS CUSTOMER`)
    parts.push(shopperNotes)
  }

  return parts.join('\n')
}
```

---

## What the Shopper Can Ask

The AI handles any question about the current order. Examples:

**Product identification:**
> "Is this the teff flour they need?"
> "I see two sizes of olive oil — which one?"
> "This is the only berbere here — is this brand okay?"

**Ingredient check without scanning:**
> "Can you read the ingredients on this? I can't see them well."
> [Shopper holds up the product to the camera]
> AI reads the label through vision and runs the constraint check verbally.

**Finding products:**
> "I can't find the niter kibbeh — where would it be in a store like this?"
> AI gives a general suggestion based on product category knowledge: "Usually in the refrigerated section with butter and cooking fats, or near spices in Ethiopian specialty stores."

**Substitution judgment:**
> "They're out of the 2kg bag of teff — they only have 1kg. Should I get two?"
> AI checks the order quantity and user note: "The order says 2kg total. Two 1kg bags is fine — go ahead."

**Constraint check:**
> "Wait, does sesame come in this?"
> [Shopper holds package to camera]
> AI: "Yes, sesame oil is the third ingredient. Put it back — hard block for this customer."

**Order status:**
> "How many items do I still need?"
> AI gives the current count of unchecked items from the order list.

---

## The Voice and Vision Pipeline

```
Shopper's phone mic + rear camera
        │
        ▼
Cloudflare Realtime SFU
  (nearest PoP — anycast)
        │
        ▼
OrderAgent DO (WebSocket adapter)
  - PCM audio chunks → forwarded to Gemini as realtime_input.audio
  - JPEG frames → forwarded to Gemini as client_content inline_data
        │
        ▼
Gemini 3.1 Flash Live
  (sees product labels, reads ingredients, hears shopper)
        │
        ▼
OrderAgent DO
  - Audio response chunks → forwarded to Shopper's phone
        │
        ▼
Shopper hears AI response through phone speaker or earbuds
```

This is the identical pipeline to the cooking session, implemented inside the OrderAgent DO rather than the CookingAgent DO.

---

## Scanner + Voice: How They Work Together

The shopper has two interaction modes simultaneously:

**Mode 1: Voice + Vision (ambient)**
The AI is always listening and watching as the shopper moves through the store. The shopper talks naturally. The AI responds when asked or when it notices something important through the camera.

**Mode 2: Scanner tap (explicit)**
When the shopper taps the scanner button, a product scan runs against the order list and constraint snapshot — exactly as before. The result appears on screen AND the AI confirms it verbally: "Got it — injera flour, that's item 3, checked off. One more to find in this aisle."

The voice and scanner are not competing — they are layered. The scanner creates the official record (what was logged in `shopper_scan_log`). The voice AI is the shopper's thinking-out-loud companion.

---

## Proactive Camera Awareness

Just like the cooking agent watches the kitchen for problems, the shopping AI watches the store environment for things worth flagging — without waiting to be asked.

**Proactive triggers:**

- **Allergen spotted on a label in the camera view**: if the AI sees through the camera that the shopper is reaching for a product with a known allergen before they scan it — "Hold on — that one has sesame. Your customer has a sesame allergy."

- **Better option visible in frame**: if the camera shows two products side by side and the AI can see the second is a better match for the order — "The one on the right is the organic version — customer prefers organic."

- **Product not on the order list in the shopper's hand**: if the shopper appears to be adding something extra — "That's not on the list — did you mean to grab it?"

Proactive observations are suppressed if the shopper just spoke (5-second dead zone after any shopper speech) and if the AI spoke in the last 30 seconds (cooldown). Same suppression logic as the cooking session's `ProactiveSpeechEngine` — adapted for the shopping context.

---

## Earbuds-First Design

The shopper experience is designed for earbuds. The shopper keeps their phone in their pocket or in a belt clip. They are not looking at the screen to interact with the AI — they are talking and listening while their hands hold products, push a cart, or carry bags.

This means:
- AI responses are short — one or two sentences maximum for routine confirmations
- AI raises its voice clarity (no equivocating phrasing) for hard blocks: "Do not buy that. Hard stop."
- The scanner result is also read aloud when the shopper scans: "Teff flour — checked off. 4 items left."
- All navigation prompts are verbal: "Shopping done — head to checkout."

The screen shows the order list and scan results for reference, but the shopper should be able to complete the entire order without looking at the screen once.

---

## Session Lifecycle

The shopper AI session opens when the shopper taps "Start shopping" (status changes to `shopping`). It runs until the shopper taps "Shopping done."

The session uses the same 90-second proactive Gemini reconnect from the cooking session spec (`cooking-session/09-reconnection.md`) — a long shopping trip at a large market can easily exceed 25–30 minutes. The reconnect is invisible to the shopper.

If the shopper loses network connectivity in a poor-signal area of the store:
- The voice AI pauses (cannot stream without network)
- The scanner continues to work for cached products (product data pre-cached when the order is accepted)
- When connectivity restores: the AI reconnects and resumes — "I lost signal for a bit — you have 5 items left."

---

## What the Shopper AI Does NOT Do

- It does not share anything about the user's identity, name, or personal history beyond what is needed for this order
- It does not speak unless the shopper speaks first OR a proactive trigger fires (not a constant stream of commentary)
- It does not make purchasing decisions — it advises; the shopper acts
- It does not connect to the user's live scan-together session — the user hears nothing from the shopper's AI channel (the scan results are shared, but not the voice conversation)
- It does not record or store the shopper's voice — same voice privacy model as the cooking session and Ground voice-to-find flow: audio is processed in real time and discarded

---

## OrderAgent DO — Additions for Shopper AI

The `OrderAgent` state gains a `shopperGeminiWs` alongside the existing WebSocket connections:

```typescript
interface OrderAgentState {
  // ... existing fields ...
  shopperGeminiWs:   WebSocket | null   // Gemini Live session for the shopper
  shopperRealtimeWs: WebSocket | null   // Cloudflare Realtime adapter for shopper audio+video
}
```

The shopper AI session is opened by a new DO endpoint: `/shopper-session` — called by the shopper app when they tap "Start shopping." It follows the same `openGeminiSession()` pattern as the CookingAgent, but builds the shopper-specific system instruction from the order and constraint data.
