# Mesa — Overview

## What This Folder Covers

Mesa is Brioela's multi-person food intelligence layer. It lets the app evaluate products, recipes, menus, grocery lists, Bela orders, meal plans, and cooking sessions for more than one person. Mesa is not called Family Account or Household. Mesa means the table: who is eating, who can eat this, who should avoid it, and what works for everyone at the table.

This folder is currently overview-only. Full implementation files are intentionally not written yet because account model, tiering, invite permissions, and data ownership need product decisions first.

## Status

[~] overview only — full build-guide not started

## Specs This Folder Draws From

- `brioela-specs/41-mesa.md` — Mesa source spec: multi-person food audience, owner-managed profiles, invited contributor model, shared enrichment, privacy, tiering questions
- `brioela-specs/37-guest-and-cooking-for-others.md` — temporary guest constraints and recurring guest patterns
- `brioela-specs/31-kids-food-literacy-mode.md` — parent-controlled kid scanning and no child identity profile

## Key Product Decisions Captured

- Product name: **Mesa**.
- User-facing copy should not call this Family Account or Household.
- Mesa is the food audience layer: every food decision can ask who it is for.
- Start with owner-managed Mesa before full multi-account auth.
- Later invited accounts can contribute selected scans/events into Mesa if permissioned.
- Invited accounts keep their private Brioela memory private by default.
- Mesa can enrich shared pantry, grocery, recipe, and scan context without copying everyone's private brain.
- Child members do not imply child login or child identity storage.
- Mesa is likely a higher-tier/upgraded feature; pricing mechanics live in `25-pricing-tiers`.

## What This Folder Depends On

- `05-orchestrator` — private per-user brain; Mesa owner state and permissioned writes need Orchestrator boundaries
- `06-memory-engine` — member/constraint/audience data eventually needs private schema design
- `07-scanner` — product compatibility is the first obvious Mesa surface
- `14-pantry-meal-plan` — meal/grocery planning for more than one person
- `17-menu-scanning` — restaurant menu compatibility for everyone at the table
- `21-kids-mode` — supervised child co-scan is an early Mesa-adjacent behavior, but not full Mesa

## What Depends On This Folder

- `25-pricing-tiers` — Mesa should become an upgrade-tier feature or add-on
- Future Bela enhancements — shopper substitutions for active Mesa audience
- Future shared account/invite implementation

## Boundary With Guest Mode

- Guest Mode is temporary: "I'm cooking for someone vegan tonight."
- Mesa is persistent: recurring people or groups whose constraints shape ongoing shopping, scanning, planning, and cooking.
- Guest patterns may later be promoted into Mesa if the owner confirms.

## Boundary With Kids Mode

- Kids Mode is tone and supervised learning.
- Mesa is multi-person compatibility.
- A child can use Kids Mode without Mesa.
- Mesa may later give Kids Mode member-specific constraints, but only if the owner created them.

## Initial Data Concepts

```typescript
type FoodAudience = {
  mode: "just_me" | "mesa" | "selected_members" | "guest_session"
  memberIds: string[]
}

type MesaMember = {
  memberId: string
  mesaId: string
  label: string
  role: "self" | "partner" | "child" | "elder" | "guest" | "caregiver" | "other"
  ageBand: "child_5_7" | "child_8_10" | "child_11_12" | "teen" | "adult" | "elder" | null
  status: "active" | "archived"
}
```

## Open Decisions Before Full Build

- Launch as owner-managed only, or include invited contributors?
- Which tier owns Mesa?
- How many Mesa members are included per tier?
- Can invited adults edit constraints or only contribute scans?
- How does deletion/export work for contributed Mesa data?
- Does Mesa include guests, or are guests promoted from Guest Mode only after confirmation?

Do not write implementation files until these are decided.
