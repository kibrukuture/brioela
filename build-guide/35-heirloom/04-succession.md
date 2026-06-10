# Heirloom — Succession

## What This File Covers

What happens to an Heirloom when its owner leaves.

## Source Specs

- `brioela-specs/48-heirloom.md`
- `brioela-specs/32-grandma-style-flavor-profile.md` (deletion grace precedent)

## Successor Designation

- The owner names a successor from accepted recipients (`heirloom_succession` row in Supabase).
- Changeable anytime. One successor per Heirloom.

## On Account Deletion

The deletion flow (which already warns about style-profile loss per spec 32) offers the transfer:

- With a designated successor: the successor becomes the **keeper** — they can re-share the Heirloom onward to new family members. (Nothing new can be captured from a deleted account; keeping is about distribution, not authorship.)
- Without designation: delivered copies simply persist (copy model). Nothing transfers automatically.

## Dormancy

Brioela never infers death and never moves content without a prior explicit instruction. There is no inactivity-triggered transfer, no "legacy contact" heuristics.

## Roles Recap

| Role | Can |
|---|---|
| owner | curate, invite, push versions, designate successor |
| keeper | re-share onward (post-succession) |
| recipient | use, annotate, adapt, delete their copy |

## Rule

Succession is the only mechanism by which control moves, and it only ever moves because the owner said so while they could.
