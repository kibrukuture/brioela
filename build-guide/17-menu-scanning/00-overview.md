# Menu Scanning — Overview

## What This Folder Covers
Point camera at a restaurant menu, get per-dish verdicts in under 3 seconds. Each dish is green (safe), yellow (ask waiter), or red (hard constraint violation). For yellow dishes, Brioela generates the exact question to ask: "Does this contain [X]? Is it cooked in a shared fryer with [allergen]?" Works on paper menus, screen menus, multi-page menus, and digital menus via URL. Low-connectivity offline partial mode using cached constraint profile.

## Status
[x] complete — five files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-input-capture.md` | photo, multi-page, QR/link, and low-light menu input handling |
| `02-menu-ocr-and-parsing.md` | OCR reuse, menu-specific parsing, structured dish schema, latency boundary |
| `03-dish-verdicts.md` | constraint-profile loading, green/yellow/red verdict rules, ranking behavior |
| `04-waiter-questions.md` | exact yellow-flag question generation and user-facing script rules |
| `05-storage-offline-map.md` | transient storage, offline partial mode, map/community overlay, upgrade trigger |

## Specs This Folder Draws From
- `brioela-specs/27-restaurant-menu-scanning.md` — full menu scan spec: input handling, AI processing, constraint profile used, waiter script generation, offline mode, map integration

## Key Decisions From Specs
- Processing: OCR → LLM parses menu into structured dishes → each dish evaluated against constraint profile from Orchestrator DO
- Standard text LLM call (NOT Gemini Live) — one-shot structured extraction, <3s latency
- Dishes with no ingredient detail flagged yellow by default (unknown = ask, never assume safe)
- Waiter script: pre-formulated, specific, non-awkward — removes anxiety of not knowing what to ask
- Raw OCR text discarded after processing; results stored for session only unless user saves
- Offline: cached constraint profile enables local constraint matching; community notes unavailable offline
- Map integration: if restaurant is in healthy food map, community notes about that place overlay the menu scan result
- Upgrade trigger: free users hit menu scan → Core tier upgrade prompt

## What This Folder Depends On
- `05-orchestrator` — user's full constraint profile (allergies, dietary identity, medical conditions, medications)
- `07-scanner` — OCR pipeline reused for menu photo processing
- `10-map` — restaurant's community notes for trust layer overlay

## What Depends On This Folder
- `25-pricing-tiers` — uses menu scanning as a Core tier upgrade trigger; entitlement mechanics live there, not here
