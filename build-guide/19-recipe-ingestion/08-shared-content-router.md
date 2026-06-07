# Recipe Ingestion — Shared Content Router

## What This File Covers

The classification and routing layer for anything shared to Brioela. Recipe reconstruction is one route, not the assumption. This file owns the rule: the agent figures out what the shared content is and writes/routes it to the right part of the user's Brioela memory.

---

## Core Rule

The share sheet accepts food-related content, not only recipes.

The first backend decision is:

```text
What is this, and where does it belong?
```

Only after classification should Brioela decide whether to run recipe extraction.

---

## Classification Output

```typescript
type SharedContentClassification = {
  jobId: string
  primaryKind: "recipe" | "restaurant_menu" | "place" | "product" | "receipt" | "food_note" | "shopping_list" | "unknown_food" | "non_food"
  secondaryKinds: string[]
  confidence: number
  reasons: string[]
  recommendedRoute: "recipe_import" | "menu_scan" | "map_place" | "product_scan" | "receipt_import" | "memory_event" | "needs_user_choice" | "reject"
}
```

Examples:

- TikTok pasta video with ingredients in caption → `recipe_import`.
- Restaurant QR/menu URL → `menu_scan`.
- Google Maps restaurant link → `map_place`.
- Grocery product page → `product_scan` or `memory_event`.
- Receipt screenshot → `receipt_import`.
- "I want to try this cafe" link → `map_place` plus private memory note.
- Random non-food meme → `reject`.

---

## Route Rules

Recipe route:

- Run source extraction.
- If incomplete, run deep public web search for supporting recipe evidence.
- Normalize only if enough evidence exists.
- Check user constraints.
- Save recipe or partial source.

Menu route:

- Send URL/image to `17-menu-scanning` parsing path.
- Produce user-specific green/yellow/red dish results.
- If restaurant/place is known, attach to shared menu intelligence where privacy rules allow.

Place route:

- Resolve place identity through `10-map`.
- Save a private memory event if the user intent is clear: wants to visit, ate there, or is planning.
- Do not create a public review.

Product route:

- Resolve product if UPC/product URL/label is available.
- Route through scanner/product constraint logic.
- Save scan-like memory only if enough product identity exists.

Receipt route:

- Route to `13-receipt-intelligence` GPT-4o mini vision extraction and line-item parsing.
- Preserve uncertain lines.
- Do not treat a receipt as a recipe.

Food note route:

- Write a lightweight `memory_event` or candidate `user_memory` only if the shared content clearly says something useful about the user's food life.

---

## User Choice Fallback

If classification confidence is low, ask the user one short question.

Examples:

```text
What should I do with this?
```

Options:

- Save as recipe
- Scan as menu
- Save place
- Remember note
- Ignore

Do not show a long form. The share-sheet loop must stay fast.

---

## Memory Writes

Non-recipe shares can still matter.

Allowed private memory events:

```typescript
type SharedContentRoutedEvent = {
  kind: "shared_content_routed"
  primaryKind: SharedContentClassification["primaryKind"]
  route: SharedContentClassification["recommendedRoute"]
  sourceUrlHash: string | null
  sourceApp: string | null
  entityKind: "recipe" | "place" | "product" | "receipt" | "menu" | "note" | null
  entityId: string | null
  confidence: number
}
```

Do not store raw shared content in memory by default. Store route, entity references, and useful derived facts.

---

## Live Agent Escalation

If the route needs conversation, Brioela can escalate into the common realtime assistant surface.

Use cases:

- imported recipe has a hard allergy conflict
- recipe is reconstructable but missing critical quantities
- menu item needs waiter-question help
- shopper needs substitution guidance
- user asks what to do with a shared place/product

This uses the same voice/video intelligence stack as Cooking Session when realtime conversation is needed. It should be treated as a reusable Brioela assistant capability, not a cooking-only idea.

---

## Privacy Boundary

Shared content routing writes to the user's private Orchestrator context unless the target feature explicitly owns shared/public data.

Rules:

- Recipe imports are private by default.
- Place memories are private unless submitted as Ground finds through Ground's gate.
- Menu facts can become shared only through menu-scanning privacy rules.
- Receipt data stays private except allowed anonymized price aggregates.
- Non-food content is rejected, not stored.

The agent can be smart about routing without turning every share into public data.
