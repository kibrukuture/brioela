# Brioela Generative Grammar — Primitive Layers And Reuse

## What This File Covers

The three layers of primitive, how they are reused across **every** feature instead of being
baked per-feature, why a generic primitive is not a shadcn primitive, and the exact rule for
when a feature earns a brand-new domain primitive. This file resolves the central fear about the
whole system:

> "If there are only ~60 primitives and none of them were built for shopper or Bela, can those
> features get any generative UI at all — or does the AI just have nothing to choose?"

The answer is: they already have UI, because most primitives belong to no feature at all.

---

## The Fear, Stated Plainly

There are two ways to design primitives, and both look like traps:

- **Bake them per feature.** `recipe_step`, `mesa_member_row`, `scan_verdict`… Then every new
  feature (shopper, Bela, illness-detective, menu-scan) needs its own set, you need *infinite*
  primitives, and any feature without a set gets no generative UI.
- **Make them all generic.** `text`, `row`, `metric`… Reusable everywhere, but now it smells
  like shadcn — generic boxes with no taste, the exact thing we refuse to ship.

Both fears are real. Both dissolve once you stop treating "primitive" as one kind of thing.

---

## The Resolution: Primitives Come In Three Layers

| Layer | Domain-tied? | Reused by | Target count | Examples |
|---|---|---|---|---|
| **Structural** | No — pure layout | every feature | ~15–25 | `stack` · `cluster` · `rail` · `grid` · `split` · `focus_window` · `ribbon` · `constellation` |
| **Expressive** | No — generic meaning | every feature | ~25–40 | `headline` · `caption` · `metric_single` · `reason_statement` · `question_line` · `confidence_note` · `source_caveat` · `meter` · `chip` · `thread` · `stamp` · `timestamped_note` |
| **Domain** | Yes — real data shape | one feature (a few shared) | ~15–25, grows | `recipe_step` · `recipe_timing` · `mesa_member_row` · `ingredient_list` · `origin_mark` |

### Layer 1 — Structural primitives

Pure layout. They carry no meaning and no domain. They arrange whatever is put inside them.
`stack` stacks, `rail` scrolls horizontally, `grid` lays out a matrix, `focus_window` frames a
single focal element in negative space. Every feature — scan, shopper, Bela, Mesa, cooking —
uses these unchanged. They are the skeleton.

### Layer 2 — Expressive primitives

Generic meaning atoms. A `headline` is a headline whether it states a scan verdict, a price
drop, or an order status. A `metric_single` is one number presented with weight, for any number
in the app. A `reason_statement` explains *why*, for any why. These are **not** tied to recipe,
memory, or scan — they are the words of the language, and every feature speaks the same words.
This layer does the bulk of the work in almost every moment.

### Layer 3 — Domain primitives

The few atoms whose **data shape** is genuinely feature-specific and cannot be carried by a
generic atom. A `recipe_step` has an index, an instruction, and a timing — structure a
`caption` cannot hold. A `mesa_member_row` pairs a member with a per-member verdict. These are
correctly feature-baked. They are the spice, not the meal — small in number, growing only as
features prove they need them (see the Domain-Primitive Rule below).

---

## The ~60 Is Mostly Reusable, Not Split Per Feature

The single most important correction in this file:

> "~60 primitives" does **not** mean "60 split across the features, so each feature gets six."
> It means **~40 generic atoms that every feature reuses + ~20 domain atoms that grow over
> time.**

A new feature does not start from zero. It starts with the entire Structural and Expressive
layers already available — ~40 atoms of immediate vocabulary — and adds domain atoms only where
its data demands it. The generic layers are the floor every feature stands on.

---

## Why Shopper, Bela, And Every Future Feature Already Have UI

None of these need a new primitive to get a beautiful generative moment. They compose from the
generic layers that already exist:

- **Shopper — "this is cheaper 200m away":**
  `focus_window` ( `headline` "Cheaper nearby" · `metric_single` "$3.20 → $2.10" ·
  `reason_statement` "you buy this most weeks" ) — **zero new primitives.**
- **Bela — "your order cleared escrow":**
  `stack` ( `headline` · `timestamped_note` · `metric_single` ) — **zero new primitives.**
- **Menu scan — "three safe picks here":**
  `rail` of `chip` + `caption`, headed by a `headline` — **zero new primitives.**

A feature only reaches for a domain primitive when its data has a shape the generic atoms can't
express — and even then, just one or two.

---

## Generic Is Not shadcn: Where Taste Actually Lives

This is the principle that frees the whole design:

> **Taste does not live in the primitive. It lives in the rendering layer and the composition's
> art-direction.**

shadcn feels soulless because its generic `button`/`card` are *also rendered* generically —
flat default styling, default spacing, no atmosphere. Our generic `headline` is rendered through
the Brioela design system: a `typography_display` type register, expansive spacing tokens, a Skia
atmosphere behind it, a choreographed beat on entrance. **Same generic role, completely
different soul.**

The corollary kills a tempting mistake: naming a primitive `recipe_headline` instead of
`headline` buys **zero** taste — it does not make the headline one pixel more beautiful. It only
makes the atom un-reusable. You would be trading reusability away for nothing. Genericity of
*role* costs nothing in beauty, because beauty is added downstream, in how the atom is rendered
and arranged.

---

## The Domain-Primitive Rule (when a feature earns a new atom)

Add a domain primitive **only** when all of these are true:

1. The content has a **structured data shape** (multiple typed fields with a relationship), not
   just text — e.g. a recipe step's `{ index, instruction, timing }`.
2. That shape **cannot be expressed** by composing existing generic atoms without losing
   meaning.
3. The shape is **specific to one feature** (or a small known set), not a general pattern.

If a candidate is really "a generic atom with feature-flavored styling," it is **not** a domain
primitive — it is a generic atom plus a tone/voice token. Do not promote it.

Examples that pass: `recipe_step`, `mesa_member_row`, `ingredient_list`, `origin_mark`.
Examples that fail (use generic instead): "recipe headline" → `headline`; "nutrient bar" →
`meter`; "additive tag" → `chip`; "memory note" → `timestamped_note`; "scan swap" →
`swap_suggestion`.

---

## Spice, Not Meal

In a typical generative moment, the overwhelming majority of the tree is Structural +
Expressive, with at most a domain atom or two. The generic layers are the meal; domain atoms are
the spice that makes a particular feature taste like itself. A system whose moments are mostly
domain primitives has over-baked — pull the generic layer back up.

---

## Anti-Patterns

- **Domaining a generic atom** — `recipe_headline`, `scan_metric`, `bela_caption`. Costs reuse,
  adds nothing.
- **One-primitive-per-feature thinking** — assuming each feature needs its own set. It needs the
  generic layers plus a small spice rack.
- **"Generic = soulless"** — conflating the *role's* genericity with the *render's* quality.
  Taste is downstream.
- **Promoting a styled generic to a domain primitive** — if it's a generic atom with a tone
  token, keep it generic.

---

## Worked Examples (generic vs domain mix)

| Moment | Structural | Expressive (generic) | Domain |
|---|---|---|---|
| Scan verdict | `focus_window` | `headline` · `caption` · `metric_single` | — |
| Shopper price drop | `focus_window` | `headline` · `metric_single` · `reason_statement` | — |
| Bela order cleared | `stack` | `headline` · `timestamped_note` · `metric_single` | — |
| Mesa table fit | `grid` | `headline` · `caption` | `mesa_member_row` |
| Recipe steps | `rail` | `headline` | `recipe_step` · `recipe_timing` |

The pattern is consistent: generic layers carry the moment; domain atoms appear only where the
data is genuinely structured and feature-specific.

---

## Growth Model

The Structural and Expressive layers are near-stable — they grow slowly and benefit every
feature at once. The Domain layer grows a few atoms per feature, through the build-time creation
lane (`08`): a feature proves it has a structured shape generic atoms can't carry, an atom is
designed and reviewed against the quality bar, shipped, and only then selectable at runtime. The
generic floor rises rarely; the spice rack grows steadily.

---

## What This File Depends On

- `03-primitive-families.md` — the original primitive inventory this re-layers.
- `11-composition-catalog-and-scale.md` — how primitives roll up into compositions.
- `12-naming-law.md` — generic atoms take no domain prefix; domain atoms do.

## What Depends On This File

- `13-how-ai-selects.md` — per-surface allowlists expose generic + relevant domain atoms.
- `19-code-package-structure.md` — the `schema/primitives/` folder is grouped by these layers.
