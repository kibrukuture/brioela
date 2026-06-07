# Passport — Overview

## What This Folder Covers

Passport is Brioela's temporary, privacy-safe food instruction artifact for real-world handoffs. It lets the user show or send only the food rules another human needs right now: a waiter, Bela shopper, caregiver, school staff, host, practitioner, or someone helping choose food. Passport is not a Discovery Card and not social sharing. It is an action object.

## Status

[x] complete — seven files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-passport-types.md` | Passport kinds, use cases, audience model |
| `02-passport-data-model.md` | Orchestrator/private schema, instruction blocks, expiration/revocation |
| `03-generation-flow.md` | generation triggers, source selection, privacy minimization |
| `04-privacy-and-consent.md` | sensitive fields, redaction, explicit inclusion, non-medical boundary |
| `05-translation-and-display.md` | translation, show-screen/image/PDF/QR/text display modes |
| `06-feature-integration.md` | Menu, Mesa, Bela, Travel, Medical Conditions, Kids, Verified Profiles |
| `07-rendering-with-grammar.md` | rendering through Brioela Generative Grammar and static fallbacks |

## Specs This Folder Draws From

- `brioela-specs/43-passport.md` — Passport source spec
- `brioela-specs/27-restaurant-menu-scanning.md` — waiter question generation and menu scan context
- `brioela-specs/41-mesa.md` — multi-person food audience
- `brioela-specs/28-medical-condition-food-profile.md` — condition food rules and medical boundary

## Key Decisions

- Name is **Passport**. Do not call it Food Passport or Mesa Passport.
- Passport is a real-world handoff artifact, not a viral share card.
- Passport is generated only by user action or explicit confirmation.
- Passport is temporary and expires.
- Passport is revocable.
- Passport includes only necessary food instructions, never a full private profile dump.
- Passport can be translated.
- Passport can render on screen, image, PDF, QR link, or text.
- Passport uses Generative Grammar for presentation, but safety content is static/validated.

## What This Folder Depends On

- `05-orchestrator` — private user/Mesa/condition data and Passport records
- `17-menu-scanning` — waiter questions and restaurant/menu triggers
- `22-medical-conditions` — condition food rules and non-medical boundary
- `26-mesa` — multi-person Food Audience
- `11-bela` — shopper handoff use case
- `18-ambient-intelligence` — travel context/language hints
- `27-generative-grammar` — safe rendering grammar

## What Depends On This Folder

- Future restaurant flow improvements
- Future Bela shopper handoff improvements
- Future travel food safety flows
- Future caregiver/school flows
