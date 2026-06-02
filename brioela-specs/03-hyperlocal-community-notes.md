# 03. Hyperlocal Community Notes

> **Deprecated — superseded by spec 35 (Ground).**
>
> This spec described a generic community note system attached to products. The full design has been replaced by Ground (spec 35), which implements the same goal with a complete privacy model, AI authenticity gate, voice-to-find flow, 3D map surface, and strict no-social-media design constraints.
>
> The data model, API surface, and moderation approach in this spec are **not implemented**. Refer to spec 35 for the current design.

## Original Goal (historical reference)
Attach local, product-specific notes to scanned food items so nearby users can benefit from real usage feedback that is more contextually relevant than global reviews.

## What Replaced This

Spec 35 (Ground) covers:
- Product-linked finds (the equivalent of community notes, product-specific)
- Location-scoped visibility via the 3D Ground map
- AI authenticity gate replacing manual moderation
- Voice-to-find flow with audio discarded at source
- Privacy model with no public contributor identity
- No engagement signals (no helpful counts, no voting)

The `find` table in spec 35 replaces `community_note`. The `location_signal_summary` table replaces `note_signal`. There is no equivalent to `note_visibility_window` — finds expire by timestamp, not by configured window.

## API Surface (replaced)

The spec 35 equivalents:
- `POST /api/finds` (replaces `POST /api/community-notes`)
- `GET /api/finds/nearby` (replaces `GET /api/products/:id/community-notes`)
- `POST /api/finds/:id/report` (retained concept, same shape)
