# Menu Scanning — Overview

## What This Folder Covers
Point camera at a restaurant menu, scan a restaurant QR code, or share a menu URL, then get a fully parsed, per-dish decision surface in under 3 seconds. Each dish is green (likely OK), yellow (ask waiter), or red (hard constraint violation) for this specific user. For yellow dishes, Brioela generates the exact question to ask: "Does this contain [X]? Is it cooked in a shared fryer with [allergen]?" Works on paper menus, screen menus, multi-page menus, QR menus, and digital menus via URL. Low-connectivity offline partial mode uses the cached constraint profile when possible.

The larger product angle: every menu scan also improves Brioela's restaurant intelligence layer. Private health constraints stay in the user's Orchestrator SQLite, while normalized restaurant/menu facts and aggregate safety signals can improve future scans, map ranking, and personalized restaurant discovery for other users.

## Status
[x] complete — seven files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-input-capture.md` | photo, multi-page, QR/link, and low-light menu input handling |
| `02-menu-gpt4o-mini-vision-and-parsing.md` | GPT-4o mini vision extraction reuse, menu-specific parsing, structured dish schema, latency boundary |
| `03-dish-verdicts.md` | constraint-profile loading, green/yellow/red verdict rules, ranking behavior |
| `04-waiter-questions.md` | exact yellow-flag question generation and user-facing script rules |
| `05-storage-offline-map.md` | transient storage, offline partial mode, map/community overlay, upgrade trigger |
| `06-shared-menu-intelligence.md` | shared restaurant menu data, aggregate safety signals, privacy boundary |
| `07-personalized-restaurant-discovery.md` | user-specific restaurant ranking from menu, map, price, and health signals |

## Specs This Folder Draws From
- `brioela-specs/27-restaurant-menu-scanning.md` — full menu scan spec: input handling, AI processing, constraint profile used, waiter script generation, offline mode, map integration

## Key Decisions From Specs
- Processing: GPT-4o mini vision extraction → LLM parses menu into structured dishes → each dish evaluated against constraint profile from Orchestrator DO
- Standard text LLM call (NOT Gemini Live) — one-shot structured extraction, <3s latency
- Dishes with no ingredient detail flagged yellow by default (unknown = ask, never assume safe)
- Waiter script: pre-formulated, specific, non-awkward — removes anxiety of not knowing what to ask
- Raw extracted text discarded after processing; results stored for session only unless user saves
- Normalized public menu facts can feed shared restaurant intelligence after privacy filtering
- Offline: cached constraint profile enables local constraint matching; live Ground signals unavailable offline
- Map integration: if restaurant is in healthy food map, Ground signals about that place can overlay the menu scan result
- Discovery: Brioela should eventually show the best places for this user, not a generic list of all restaurants
- Upgrade trigger: Sapor users hit menu scan → Luma upgrade prompt

## What This Folder Depends On
- `05-orchestrator` — user's full constraint profile (allergies, dietary identity, medical conditions, medications)
- `07-scanner` — GPT-4o mini vision extraction pattern reused for menu photo processing
- `10-map` — restaurant Ground signals for place context overlay

## What Depends On This Folder
- `10-map` — can use shared menu intelligence to rank and render restaurants more personally
- `18-ambient-intelligence` — can suggest restaurants before trips or mealtimes using derived place/menu fit
- `25-pricing-tiers` — uses menu scanning as a Luma upgrade trigger; entitlement mechanics live there, not here
