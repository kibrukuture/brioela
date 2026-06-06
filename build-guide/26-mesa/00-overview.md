# Mesa — Overview

## What This Folder Covers

Mesa is Brioela's multi-person food intelligence layer. It lets the app evaluate products, recipes, menus, grocery lists, Bela orders, meal plans, and cooking sessions for more than one person. Mesa is not called Family Account or Household. Mesa means the table: who is eating, who can eat this, who should avoid it, and what works for everyone at the table.

## Status

[x] complete — ten files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-mesa-data-model.md` | Orchestrator SQLite tables for Mesa, members, constraints, audience, candidates, invites |
| `02-conversational-setup.md` | no-form Mesa creation, voice/chat member addition, confirmation language |
| `03-mesa-tools.md` | AI-callable Mesa tools under `tools/mesa/` and permissions |
| `04-food-audience.md` | just me / Mesa / selected members / guest session audience model |
| `05-compatibility-engine.md` | per-member compatibility, works-for-everyone verdicts, severity aggregation |
| `06-feature-integration.md` | scanner, recipes, menu scanning, meal plan, Bela, cooking, Kids Mode integrations |
| `07-shared-enrichment-and-invites.md` | invited account contribution, scoped sharing, no private brain copy |
| `08-potential-members.md` | inferred potential Mesa members from repeated cooking/shopping patterns |
| `09-privacy-permissions.md` | member privacy, child restrictions, medical/wearable boundaries, deletion/export |
| `10-tiering-and-rollout.md` | Mesa tier/add-on boundary, launch phases, upgrade copy, open pricing decisions |

## Specs This Folder Draws From

- `brioela-specs/41-mesa.md` — Mesa source spec: multi-person food audience, owner-managed profiles, invited contributor model, shared enrichment, privacy, tiering questions
- `brioela-specs/37-guest-and-cooking-for-others.md` — temporary guest constraints and recurring guest patterns
- `brioela-specs/31-kids-food-literacy-mode.md` — parent-controlled kid scanning and no child identity profile

## Key Product Decisions Captured

- Product name: **Mesa**.
- User-facing copy should not call this Family Account or Household.
- Mesa is the food audience layer: every food decision can ask who it is for.
- Start with owner-managed Mesa and support scoped invited contributors without requiring every member to have an account.
- Mesa is conversational/no-form: the user can add people by talking to Brioela.
- Brioela may suggest potential Mesa members from repeated patterns, but only after strong evidence and explicit owner confirmation.
- Invited accounts can contribute selected scans/events into Mesa if permissioned.
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

- Which tier owns Mesa?
- How many Mesa members are included per tier?
- Whether invited adults can edit constraints in v1 or only contribute observations.
- Exact deletion/export UX for contributed Mesa data.
- Whether guests are promoted from Guest Mode automatically as suggestions or only through explicit owner request.

These are rollout/pricing decisions. The core Mesa architecture is defined in this folder.
