# Bela — Cooking Intent Trigger

## What This Is

The cooking intent trigger is the connection between the cooking side of Brioela and the shopping side. When the user expresses intent to cook something — in a conversation, in a cooking session, or by saving a recipe — the AI checks if they have everything they need and offers to order what is missing.

The user says "I want to make doro wat this weekend." The AI says: "You are missing: 1 whole chicken, 200g niter kibbeh. Want me to order these for Saturday morning?" One tap. Order placed. The conversation created a grocery run.

---

## Trigger Sources

### Trigger 1: Cooking Session Conversation

During or after a cooking session, the user mentions wanting to cook something specific in the near future:
- "I want to try making injera next week"
- "I've been thinking about making kitfo"
- "Let me make berbere this weekend — I think I have most of what I need"

The AI detects cooking intent from the conversation (this is part of the Orchestrator AI's standard pattern — it already extracts `travel_intent`; `cooking_intent` is the same mechanism applied to food preparation).

A `cooking_intent` event is written to `memory_event`:
```json
{
  "kind": "cooking_intent",
  "payload_json": {
    "dish": "injera",
    "timeframe": "next week",
    "confidence": 0.85
  },
  "captured_at": 1748900000000
}
```

The AI immediately checks the pantry model against the injera recipe (if one exists in the user's `recipes` table, or a standard recipe from the recipe knowledge base). It identifies the gap: what the user likely does not have.

### Trigger 2: Recipe Save

When the user saves a recipe (from any source — shared content, voice dictation, cooking session output), the system runs a pantry gap check against the saved recipe's ingredient list.

Gap check:
```typescript
async function recipeGapCheck(recipe: Recipe, userId: string): Promise<GapResult> {
  const pantryModel = await loadPantryModel(userId)

  return recipe.ingredients.map(ing => ({
    ingredient:    ing.name,
    quantity:      ing.quantity,
    inPantry:      pantryModel.estimate(ing.name) > 0,
    confidence:    pantryModel.confidence(ing.name),
    lastSeen:      pantryModel.lastScan(ing.name),
  }))
}
```

The pantry model is not a real-time inventory — it is a probabilistic model built from scan history, cooking session usage events, and receipt data. It does not know exactly how much teff flour is in the pantry. It knows: the user scans teff flour every 3 weeks on average, their last scan of teff was 19 days ago, so the probability of being low is ~0.7.

Items with pantry probability < 0.4 (likely low or out) are flagged as gap items.

### Trigger 3: Cooking Session Ingredient Request

During an active live cooking session, the user mentions mid-session that they are missing something:
- "Oh no, I don't have enough garlic"
- "I forgot to buy onions, I have none left"

The cooking AI (Gemini in the CookingAgent DO) extracts this and sends a `missing_ingredient` signal to the Orchestrator. The Orchestrator checks if an AI shopping order can be placed fast enough to be useful for this session (unlikely for an active cooking session, but possible for a "I'm going to start in 2 hours" scenario).

If same-day delivery is available and the user has a funded wallet: the Orchestrator surfaces an offer: "No garlic — do you want me to order some? I can try to get it here within the hour." If the user says yes, an urgent same-day order is placed.

---

## The Gap-to-Order Flow

When a cooking intent is detected and a pantry gap is identified, the AI surfaces an offer:

**In-conversation (during or after a session):**

```
You mentioned wanting to make injera next week.

Based on your pantry, you're likely missing:
• Teff flour (2 kg)
• Water (you have this)
• Starter culture (you may be out — last scanned 6 weeks ago)

Want me to order the teff flour and starter culture for delivery 
before the weekend?

[ Order for Saturday morning ]  [ I'll get it myself ]  [ Not yet ]
```

**From a recipe save (notification, not in-conversation):**

```
New recipe saved: Grandma's Doro Wat

You're probably missing 3 ingredients:
Whole chicken (1.5 kg) · Niter kibbeh (200g) · Berbere spice (150g)

[ Order these — deliver Saturday ]  [ View recipe ]
```

Both surfaces lead to the same order creation flow: the gap items are pre-filled in the order list, the user confirms (or edits) and places the order.

---

## Link Between the Order and the Recipe

When an order is placed via cooking intent trigger, the order is linked to the recipe or session that triggered it:

```sql
orders.source_kind = 'cooking_intent'
orders.source_ref  = recipe_id  (or session_id for session-triggered orders)
```

This link enables the post-delivery cooking session prompt:

At delivery confirmation, if the order was cooking-intent-triggered:

```
Groceries delivered ✓

Everything for your doro wat is here.
Want to start a cooking session now?

[ Start cooking doro wat ]  [ Later ]
```

Tapping "Start cooking doro wat" opens the live cooking session with:
- The doro wat recipe pre-loaded
- The AI (Gemini) given context: "The user just received fresh ingredients including a whole chicken, niter kibbeh, and berbere spice. They intend to cook doro wat."
- The cooking session begins from the recipe, not from a cold start

The grocery run was the first step of the cooking journey. The cooking session is the completion of it. Both are part of the same user intent — the AI tracks that intent from the moment it was expressed to the moment the dish is made.

---

## What the AI Does NOT Do

- It does not place orders without explicit user approval. The offer is always surfaced as a suggestion. The user must tap "Order" to confirm. Auto-ordering without confirmation is never allowed, even for standing orders (which have a 3-hour approval window).
- It does not add items to an existing in-progress standing order without the user reviewing the cycle
- It does not order for recipes the user has not expressed intent to cook — saving a recipe does not trigger an order if the user did not indicate they want to cook it soon (confidence threshold from intent detection: > 0.7 for near-term cooking intent)
- It does not order perishables with long lead times — if the user says "I want to make this someday," no order is proposed

---

## `cooking_intent` Event Kind — New Entry for spec 01

This feature requires a new event kind in the `memory_event` table (spec 01). The current event type list does not include `cooking_intent`.

**New entry to add to spec 01:**
```
cooking_intent  — user expressed intent to cook a specific dish in the near future
                  payload: { dish: string, timeframe: string|null, confidence: number }
                  written by: Orchestrator AI (via log_memory_event tool)
                  session_id: the session where the intent was expressed (nullable if detected from saved recipe)
```

This event is read by:
- The cooking intent trigger (immediately, to generate a gap check)
- The Curator's pattern detection pass (to build cooking preference patterns over time)
- The pre-trip food intelligence feature (spec 22) for travel cooking intent
