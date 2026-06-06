# Mesa — Tiering And Rollout

## What This File Covers

Mesa's tier boundary, upgrade copy, phased rollout, and unresolved pricing decisions.

---

## Tier Boundary

Mesa is an upgraded layer, not part of free basic scanning.

Sapor remains:

- basic product scans
- signed-in user's safety guardrails
- signed-in user's boycott filters

Mesa adds:

- multi-person compatibility
- Mesa audience evaluation
- Mesa meal/grocery planning
- invited contributor enrichment
- works-for-everyone decisions

---

## Upgrade Copy

Use:

```text
See what works for everyone at your table with Mesa.
```

Alternative:

```text
Add Mesa so Brioela can keep everyone's food needs in mind.
```

Avoid:

```text
Track your family.
```

---

## Rollout Phases

Phase 1:

- owner-managed Mesa
- conversational setup
- member constraints
- Food Audience
- scanner, recipe, menu, meal-plan compatibility

Phase 2:

- invited contributors
- selected scan/pantry contributions
- contribution review/acceptance

Phase 3:

- richer Mesa planning
- Bela integration
- Mesa Discovery Cards
- deeper role/permission model

---

## Pricing Decisions

Open:

- included in Viva?
- add-on to Luma/Culina/Viva?
- member-count limits?
- invited contributor limits?
- trial period after suggested Mesa prompt?

Do not hardcode final price until product decision.

---

## Launch Recommendation

Ship Mesa as a paid add-on or Viva-included layer after core Sapor/Luma/Culina/Viva are stable.

But architecture should be built early enough that scanner, meal plan, menu scanning, and cooking can accept `FoodAudience` from the start.
