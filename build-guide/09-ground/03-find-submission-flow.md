# Ground — Find Submission Flow

## What This File Covers

All ways a Find enters Ground: scan, map, ambient prompt, voice-to-find, and AI-drafted finds.

## Source Specs

- `brioela-specs/35-ground-community-intelligence.md`
- `brioela-specs/35b-ground-finds-deep-design.md`
- `build-guide/07-scanner/`

## Entry Points

### From Scan

After a product scan, if location/place is known, Brioela can prompt:

```text
Found something worth sharing about this?
```

Product and location context are prefilled.

### From Map

User taps a location/building on Ground map and adds a Find for that place.

### Ambient Suggestion

At a market/store with recent scan context, Brioela may softly ask:

```text
Seen anything worth sharing while you're here?
```

At most once per location visit.

## Voice-To-Find

Flow:

1. User taps dictation.
2. Client transcribes locally.
3. Raw transcript + product/location context go to formatting layer.
4. AI formats into a clean structured Find.
5. Voice audio is discarded immediately.
6. User previews and confirms/edits.
7. Confirmed Find enters authenticity gate.

## AI-Drafted Finds

After green/yellow scan, if place is known, Brioela may draft a Find automatically.

Examples:

- new product at location
- price change
- notable ingredient detail
- yellow health concern

User actions:

- Submit
- Edit
- Dismiss

Rules:

- No opinions.
- No promotional language.
- No unsupported claims.
- Drafts still pass through the same authenticity gate.

## Data Writes

- Shared Find writes to Supabase after gate passes.
- Private submit history writes to Brain DO `user_find_history`.
- Ground does not write to `user_memory` by default.
- Downstream actions may write memory later.
