# Heirloom — Overview

## What This Folder Covers
The Heirloom: heritage recipes (spec 13), cook style profiles (spec 32), and session moments bundled by their owner and passed to family members as independent copies — invitation-based, consent-based, with succession on account deletion. Receiving is free always (acquisition surface); assembling/sending is Chef tier. Copy-on-accept, DO-to-DO, no shared mutable object, no content ever retained outside the two Brains.

## Status
[x] guide complete — four files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-heirloom-assembly.md` | curation flow (voice-first), what can be included, the consent and preview rules |
| `02-invitation-flow.md` | invitation links/QR, non-user landing, acceptance, expiry, hashing |
| `03-do-to-do-delivery.md` | the copy-on-accept transfer: payload assembly, broker route, recipient ingestion, R2 photo copies, versioning |
| `04-succession.md` | successor designation, deletion-flow transfer, dormancy behavior |

## Specs This Folder Draws From
- `brioela-specs/48-heirloom.md` — the full feature spec
- `brioela-specs/13-generational-recipe-capture.md` — heritage recipe source and capture consent
- `brioela-specs/32-grandma-style-flavor-profile.md` — style profiles as inheritable content; the 30-day grace precedent
- `brioela-specs/12-multi-person-cooking-rooms.md` — the each-participant-owns-their-copy precedent
- `brioela-specs/21-onboarding.md` — the inheritance-entry onboarding path

## Key Decisions From Specs
- Copy, not share: acceptance delivers an independent copy into the recipient's Brain DO. Owner deletion never claws back delivered copies. No central shared object exists.
- Only heritage content explicitly curated by the owner moves. Nothing is included by default. The assembly preview shows exactly what each recipient receives.
- Supabase carries routing metadata only (invitations, succession, versions). Heirloom content travels DO-to-DO at acceptance; the broker holds it transiently only.
- Photos are copied into recipient-scoped R2 objects at acceptance — recipients never depend on the owner's objects.
- Versioning is append-only; push-forward of new items is per-addition, explicit, accept-prompted. No retroactive removal propagates.
- Succession is explicit only. Brioela never infers death, never moves content without a prior instruction. Undesignated deletion: delivered copies simply persist.
- Receiving free always; assembling/sending Chef. New-user recipients land on the Heirloom, not the scanner — measured as its own acquisition channel.
- Nothing outside heritage content is inheritable: no scan history, no memory, no health data, ever. No voice cloning, ever.

## What This Folder Depends On
- `05-brain` / `06-brain-memory` — content storage and ingestion write paths in both DOs
- `08-cooking-session` — heritage capture sessions produce the content
- `04-auth-and-onboarding` — the inheritance-entry landing and account creation
- `03-foundation` — R2 object handling, Worker broker route

## What Depends On This Folder
- `36-year-in-food` — heritage/family chapters reference Heirloom moments (audience level only)
- `24-viral-sharing` — the inheritance loop is an acquisition channel (not a share card)
