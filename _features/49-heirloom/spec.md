# Heirloom — Spec

Feature **49**. Family recipe heritage: live generational capture (**13**), grandma style flavor profiles (**32**), and curated Heirloom bundles assembled and passed to family as independent Brain copies — invitation-based, consent-based, with succession on account deletion. Receiving is **free always**; assembling/sending is **Culina** tier.

**Numbering note:** Product spec lives at `brioela-specs/48-heirloom.md` (spec **48**). Feature folder is **49** per `_features/README.md` build order. Do not confuse with `brioela-specs/49-harvest.md` (feature **53** Harvest).

**Not in this feature:** Encore plate-photo reconstruction (**48** — private `origin=encore` recipes; Heirloom assembly lists `heritage_recipe_capture` only — Encore send ambiguous, **G34**); URL/social share import (**25** — `origin=share_import`); Discovery Card renderer + privacy scrub body (**51** — may trigger Recipe Preservation Card on capture; Heirloom send is separate family infrastructure); MiraSession DO transport and cooking runtime (**29** — session-end reconstruction semantics shared; style extraction is post-session consumer); Passport handoff (**47**); public publishing or marketplace; voice cloning; multi-party live editing of a shared Heirloom; inheritance of scan history, memory, health data, or personality; guard/lexicon/reading-gate tooling.

**Living catalog note:** **Heirloom** is the umbrella product name over specs **13**, **32**, and **48**. User-facing: "an Heirloom", "her Heirloom profile", "Heirloom recipes". Code namespace: `heirloom`. Internal tables `heritage_recipe_capture`, `cook_style_profile` predate the name and remain valid.

---

## Purpose

Brioela's emotional thesis (spec **32**): *"When she is gone, her cooking lives in the app."* Today that legacy lives in one account. **49** completes the protection: capture during live cooking, extract enduring style, bundle deliberately, and deliver independent copies to family — so grandma's food memory survives churn, loss of access, or account deletion.

```text
Cook with grandma (29) → capture recipe (13) → extract style (32) → curate Heirloom (48) → invite family → copy-on-accept (DO-to-DO)
```

**49** connects existing systems — cooking session (**29**), recipe schema (**08**), style adaptation, R2 media, Supabase routing metadata, onboarding (**03**), tier gates (**43**) — it is not a standalone subsystem.

---

## Product definition

| Term | Meaning |
|---|---|
| **Heirloom** | Umbrella name: artifact (the bundle), the act of passing it, and the heritage feature family |
| **Heirloom (artifact)** | Versioned bundle: cover, heritage recipes, style profile, moments |
| **Heritage recipe capture** | Live session → structured recipe (spec **13**); internal tables `heritage_recipe_capture`, `heritage_recipe_draft` |
| **Style profile** | Post-session extraction of cook technique/seasoning identity (spec **32**); `cook_style_profile`, `cook_style_attribute` |
| **Moment** | Session photo + owner-written story attached to a recipe |
| **Owner** | User who curated and sends the Heirloom |
| **Recipient** | User who accepted and owns an independent copy |
| **Keeper** | Successor role after owner account deletion — can re-share onward |
| **Copy-on-accept** | Delivery model: each recipient gets independent Brain copy; no shared mutable object |
| **Push-forward** | Owner adds new item; prior recipients get explicit accept prompt for delta only |
| **Succession** | Explicit successor designation before account deletion |

**Design principles (non-negotiable):**

- Only heritage content **explicitly curated** by the owner moves — nothing included by default.
- Assembly preview shows **exactly** what each recipient receives before any invitation.
- Receiving inheritance is **free always** — acquisition surface, not gated.
- Assembling/sending requires **Culina** (`heirloom_send`, spec **48** / **43**).
- Copy, not share: owner deletion never claws back delivered copies.
- Brioela **never infers death** — no inactivity-triggered transfer.
- No voice cloning — recipes, style, photos, words only.
- Invitation links: **30-day expiry**, single-recipient; contact stored **hashed** in Supabase only.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/35-heirloom/`, `brioela-specs/48-heirloom.md`, `13-generational-recipe-capture.md`, `32-grandma-style-flavor-profile.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/29`, `43`, `48`, `51`, `25`.

| # | Component | Type | Layer | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **Generational cooking session** | **29** runtime | Capture | No | Multi-person or 1:1 heritage session | spec **13**, `08-cooking-session/00` |
| 2 | **`heritage_recipe_capture` table** | Brain SQLite | Capture | No | Session start / heritage mode flag | spec **13** |
| 3 | **`heritage_recipe_draft` table** | Brain SQLite | Capture | No | Post-session reconstruction | spec **13** |
| 4 | **Heritage recipe reconstruction** | LLM + vision | Capture | No | Session-end; same path as **29** recipe tree | `29` spec §10 |
| 5 | **Uncertainty markers on drafts** | Recipe fields | Capture | No | Confidence per field — never fabricate | spec **13**, **02** |
| 6 | **Finalize heritage recipe** | Handler | Capture | No | Draft review → `recipes` insert | spec **13** |
| 7 | **`recipes.origin = family_capture`** | Brain SQLite | Capture | **Partial** | Enum exists in `recipe.origin.schema.ts` — no capture writer | **G35** vs spec **38** `generational` |
| 8 | **Capture consent at session** | Mobile UX | Capture | No | Covers family preservation (spec **13**) | `01-heirloom-assembly.md` |
| 9 | **`generational_recipe_capture` tier gate** | **43** consumer | Capture | No | Culina+ required to start heritage capture | **43** matrix |
| 10 | **`cook_style_profile` table** | Brain SQLite | Style | No | Post-session async job | spec **32** |
| 11 | **`cook_style_attribute` table** | Brain SQLite | Style | No | Seasoning/technique/substitution/finishing | spec **32** |
| 12 | **`recipe_style_variant` table** | Brain SQLite | Style | No | "Cook in [name]'s style" output | spec **32** |
| 13 | **Style extraction workflow** | Upstash job | Style | No | Full transcript + vision events | spec **32** |
| 14 | **Human-language style summary** | Mobile display | Style | No | Editable by user | spec **32** |
| 15 | **Recipe style adaptation** | LLM structured | Style | No | <3s; attributed changes | spec **32** |
| 16 | **Real-time "cook like grandma"** | **29** consumer | Style | No | Mira pulls profile during session | spec **32** |
| 17 | **Style profile 30-day deletion grace** | Account lifecycle | Style | No | Hard warning before permanent delete | spec **32**, `04-succession.md` |
| 18 | **`heirloom` table** | Brain SQLite | Delivery | No | Owner / keeper / recipient roles | spec **48** |
| 19 | **`heirloom_item` table** | Brain SQLite | Delivery | No | recipe \| style_profile \| moment | spec **48** |
| 20 | **`heirloom_invitation` (Supabase)** | Postgres routing | Delivery | No | Hashed contact, status, version | spec **48** |
| 21 | **`heirloom_succession` (Supabase)** | Postgres routing | Delivery | No | Successor designation | spec **48** |
| 22 | **Heirloom assembly (voice-first)** | Mobile + handler | Delivery | No | Explicit curation; cover + items | `01-heirloom-assembly.md` |
| 23 | **Assembly preview + dedication** | Mobile UX | Delivery | No | Consent screen before invite | `01-heirloom-assembly.md` |
| 24 | **`POST /api/heirlooms`** | API | Delivery | No | Assemble from owned heritage content | spec **48** |
| 25 | **`POST /api/heirlooms/:id/invitations`** | API | Delivery | No | Link/QR; 30-day expiry | spec **48** |
| 26 | **`POST /api/heirlooms/invitations/:id/accept`** | API | Delivery | No | Triggers DO-to-DO copy | spec **48** |
| 27 | **`POST /api/heirlooms/:id/push`** | API | Delivery | No | Delta to prior recipients | spec **48** |
| 28 | **`POST /api/heirlooms/:id/successor`** | API | Delivery | No | Designate keeper | spec **48** |
| 29 | **DO-to-DO broker route** | Worker | Delivery | No | Transient payload relay only | `03-do-to-do-delivery.md` |
| 30 | **Recipient ingestion write paths** | Brain helpers | Delivery | No | Recipes + style + heirloom rows | `03-do-to-do-delivery.md` |
| 31 | **R2 photo copy at acceptance** | Storage | Delivery | No | Recipient-scoped objects; refs rewritten | spec **48** |
| 32 | **Heirloom delivery workflow** | Upstash | Delivery | No | Idempotent; no partial surface state | `03-do-to-do-delivery.md` |
| 33 | **Non-user invitation landing** | Mobile/web | Delivery | No | Cover metadata only; no recipe content in link | `02-invitation-flow.md` |
| 34 | **Inheritance-entry onboarding** | **03** consumer | Delivery | No | First experience = open Heirloom | spec **21**, `02-invitation-flow.md` |
| 35 | **`heirloom_send` tier gate** | **43** consumer | Delivery | No | Culina+ to assemble/send | **43** draft matrix |
| 36 | **Receive always free** | **43** policy | Delivery | No | No tier check on accept | spec **48** |
| 37 | **Push-forward accept sheet** | Mobile | Delivery | No | Delta only; nothing silent | `03-do-to-do-delivery.md` |
| 38 | **Deletion-flow succession offer** | **03** consumer | Delivery | No | Keeper transfer or copies persist | `04-succession.md` |
| 39 | **Heirloom library section** | Mobile | Delivery | No | Recipe library filter/tab | spec **48** UI surfaces |
| 40 | **`assemble_heirloom` Brain tool** | Tool | Delivery | No | Voice-first curation | spec **48** namespace |
| 41 | **Recipe Preservation Discovery Card** | **51** consumer | Cross | No | Trigger on generational capture — not Heirloom send | `24-viral-sharing/04` |
| 42 | **Food Time Machine generational moments** | **38** consumer | Cross | No | Re-cook history for heritage recipes | spec **38** |
| 43 | **Harvest heritage chapter** | **53** consumer | Cross | No | Audience-level Heirloom moments | `36-harvest/02-chapter-rules.md` |
| 44 | **Acoustic cue from capture** | **39** consumer | Cross | No | "You'll hear when it's ready" | `33-acoustic-cooking/02` |
| 45 | **Encore recipe in Heirloom bundle** | Boundary | **Ambiguous** | No | Spec **48** lists heritage capture only | **G34** / **48** G33 |
| 46 | **Heirloom tests** | Tests | All | No | Workflow, copy model, tier gates | — |

### Shipped in repo today (heirloom-related)

- `build-guide/35-heirloom/` — **5 files complete** (docs only; session **038** originally `35-food-inheritance/`).
- `brioela-specs/48-heirloom.md`, `13-generational-recipe-capture.md`, `32-grandma-style-flavor-profile.md`.
- `_records/connections/31-heirloom-connections.md`, `_records/build-order/32-layer-heirloom.md`.
- `recipeOriginValues` includes `'family_capture'` — **no** heritage tables, **no** capture writer, **no** Heirloom code.
- `heirloom_send` `FeatureAction` — draft only in **43** `tier.entitlement.matrix.constant.gap.md`.
- **`rg 'heirloom|heritage_recipe|cook_style' backend/src shared/ mobile/`** — zero product matches.

---

## Three-layer architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│  CAPTURE (spec 13) — during/after cooking session (29)          │
│  heritage_recipe_capture → draft → finalize → recipes           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  STYLE (spec 32) — post-session async                           │
│  transcript + vision → cook_style_profile → recipe_style_variant  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  DELIVERY (spec 48) — owner-initiated                           │
│  assemble heirloom + items → invite → accept → DO-to-DO copy    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Capture layer (spec **13**)

Live family cooking → observe, listen, reconstruct.

| Input | Required | Notes |
|---|---|---|
| Live transcript | Yes | Multi-speaker attribution when room (**12**) |
| Visual observation | Yes | Camera optional per participant |
| Timeline order | Auto | Ingredient mentions + visual objects |
| Formal measurements | No | Infer approximate; mark uncertain |

**Reconstruction strategy:** Combine transcript, ingredient mentions, visual objects, timeline. Uncertain fields use spec **02** confidence — never fabricated certainty.

**Review workflow:** End session → generate draft → highlight uncertain ingredients/amounts → user finalizes → library.

**Origin:** Shipped enum `family_capture` in `recipe.origin.schema.ts`. Spec **38** prose references `recipe.source='generational'` — align at implementation (**G35**).

**Tier:** `generational_recipe_capture` — **Culina** minimum (**43**).

---

## Style layer (spec **32**)

Post-session secondary analysis — does **not** interrupt live cooking.

**Extracted dimensions:** seasoning signature, technique fingerprints, improvisation patterns, finishing moves, spoken instincts → observable checkpoints.

**Display:** Human-language summary, editable. Warm personal UI — cook's name prominent.

**"Cook in [name]'s style":** Structured LLM adaptation; each change attributed; saved as `recipe_style_variant`; original untouched.

**Multiple profiles:** One per captured person; real-time pull during **29** when user says "cook this like grandma."

**Deletion:** 30-day grace with explicit warning — seed of inheritance protection; **49** succession completes it.

---

## Delivery layer (spec **48**)

### The Heirloom object

| Part | Contents |
|---|---|
| **Cover** | Cook name, relationship, optional photo, dedication text |
| **Recipes** | Finalized heritage recipes with uncertainty markers, session refs, owner annotations |
| **Style profile** | `cook_style_profile` summary + attributes |
| **Moments** | Session photos + owner-written stories per recipe |

**Curation:** Voice-first; explicit item-by-item; **no bulk "add everything"**.

### Invitation flow

- Per-recipient link or QR; single-recipient; 30-day expiry.
- Landing shows cover metadata only — **no recipe content in invitation payload**.
- Non-users: Apple/Google sign-in → Heirloom opens first (not scanner).
- Tagged acquisition channel: inheritance-entry vs scan-entry retention.

### DO-to-DO delivery

1. Validate invitation (status, hash match).
2. Owner Brain assembles payload at invite version.
3. Worker broker relays transiently — **nothing persisted outside two DOs**.
4. Recipient Brain ingests via standard write paths.
5. Photos copied to recipient-scoped R2; refs rewritten.
6. Invitation accepted; owner notified (high-priority in-app; push per **21** rules).

**Failure:** Idempotent workflow — double-accept no-op; recipient has complete version or none.

### Push-forward

Append-only versioning. New item → version N+1. Prior recipients offered **delta** with accept prompt. No retroactive removal propagation.

### Succession

| Mechanism | Behavior |
|---|---|
| **Successor designated** | On owner deletion → keeper can re-share onward |
| **No designation** | Delivered copies persist; nothing auto-transfers |
| **Dormancy** | Never infer death; no inactivity handoff |

| Role | Can |
|---|---|
| owner | curate, invite, push, designate successor |
| keeper | re-share onward (post-succession) |
| recipient | use, annotate, adapt (**32**), delete their copy |

---

## Data model

### Brain DO SQLite (owner + each recipient)

**Capture (spec 13):**

- `heritage_recipe_capture`: capture_id, owner_user_id, room_id, session_id, status, created_at
- `heritage_recipe_draft`: capture_id, title, ingredients_json, steps_json, confidence_json

**Style (spec 32):**

- `cook_style_profile`: profile_id, user_id, cook_name, cook_relationship, session_ids_json, style_summary_text, extracted_at, updated_at
- `cook_style_attribute`: attribute_id, profile_id, attribute_type, description, confidence_score, source_quote, created_at
- `recipe_style_variant`: variant_id, recipe_id, profile_id, adapted_recipe_json, adaptation_notes, created_at

**Delivery (spec 48):**

- `heirloom`: heirloom_id, role (owner \| keeper \| recipient), cook_name, cook_relationship, dedication_text, cover_photo_ref, version, created_at, received_from (nullable), updated_at
- `heirloom_item`: heirloom_id, item_type (recipe \| style_profile \| moment), local_ref, owner_note, added_at, version_added

### Supabase Postgres (routing metadata only — no content)

- `heirloom_invitation`: invitation_id, heirloom_id, owner_user_id, invitee_contact_hash, status (sent \| accepted \| declined \| expired), version_at_invite, created_at, responded_at
- `heirloom_succession`: heirloom_id, owner_user_id, successor_user_id, designated_at, executed_at (nullable)

**Note:** Spec **48** prose mentions `Heirloom_edition` — implement as version field on `heirloom` + invitation `version_at_invite` (**G41**).

---

## API surface

| Route | Action |
|---|---|
| `POST /api/heirlooms` | Assemble Heirloom from owned heritage content |
| `POST /api/heirlooms/:id/invitations` | Invite; returns share link/QR |
| `POST /api/heirlooms/invitations/:id/accept` | Triggers DO-to-DO delivery |
| `POST /api/heirlooms/:id/push` | Push new item; prompts prior recipients |
| `POST /api/heirlooms/:id/successor` | Designate or change successor |

---

## Tier placement

| Action | Tier | Source |
|---|---|---|
| Generational recipe capture | **Culina** | spec **19**, **43** `generational_recipe_capture` |
| Heirloom assemble/send | **Culina** | spec **48**, **43** `heirloom_send` |
| Heirloom receive | **Free always** | spec **48** |
| Succession designation | No extra gate | spec **48** |

---

## Privacy

- Assembly UI previews exact recipient payload before send.
- Capture consent (spec **13**) covers family preservation; dedication screen reminds who receives cook's recipes/style.
- Living Brioela user who is the captured cook: only content from **owner's sessions** moves.
- Supabase invitation rows: no recipe content, no health data.
- Recipient copies in "what Brioela knows about me" inventory; individually deletable.
- Heirloom is **not** viral sharing (**51**): explicit invitations only; spec **35** no-social design law.

**51 relationship:** Discovery Card "Recipe Preservation" may trigger on generational **capture** — separate from Heirloom **send**. Cards pass privacy scrub; Heirloom moves full heritage bundle privately to invited recipients only.

---

## Feature boundaries

### **49** vs **29** (cooking session)

| | **29** | **49** |
|---|---|---|
| Live Mira session, timers, Gemini transport | **Yes** | No |
| Session-end recipe reconstruction semantics | Shared path | Heritage-specific tables + finalize |
| Style extraction job | No (consumer of transcript) | **Yes** (**32** half of **49**) |

### **49** vs **32** (flavor profile — no separate feature folder)

Spec **32** is the style half of **49**. No `_features/32-*` migration folder; flavor profile ships as part of **49**.

### **49** vs **48** (Encore)

| | **48** Encore | **49** Heirloom |
|---|---|---|
| Entry | Plate photo at restaurant | Live family cooking + curation |
| Artifact | Single private reconstructed recipe | Bundle: recipes + style + moments |
| Send | Not in **48** | `heirloom_send` |
| Bundle eligibility | **Ambiguous** — spec **48** Heirloom lists `heritage_recipe_capture` only | **G34** |

### **49** vs **25** (recipe ingestion)

| | **25** | **49** |
|---|---|---|
| Entry | Share sheet / URL | Live capture + family invitation |
| Origin | `share_import` | `family_capture` |
| Delivery | Single-user library | DO-to-DO copy to recipients |

### **49** vs **51** (viral sharing)

| | **51** | **49** |
|---|---|---|
| Mechanism | Discovery Cards, public-safe scrub | Private family invitations |
| Grandma moment | Preservation **card** on capture | Full **bundle** inheritance |
| Growth loop | Share the discovery | Receive free → acquisition channel |

---

## Success metrics

**Capture (13):** finalized captures; uncertain fields per recipe; re-cook rate.

**Style (32):** profile generation rate; "cook in their style" usage; retention delta for profile holders.

**Delivery (48):** assembly rate among capture owners; invitation acceptance (existing vs new users); inheritance-entry 90-day retention vs scan-entry; push-forward acceptance; churn delta for owners/recipients.

---

## Source documents

### Primary

- `brioela-specs/48-heirloom.md`
- `brioela-specs/13-generational-recipe-capture.md`
- `brioela-specs/32-grandma-style-flavor-profile.md`
- `build-guide/35-heirloom/00-overview.md` through `04-succession.md`

### Integration sources

- `brioela-specs/12-multi-person-cooking-rooms.md` — copy-per-participant precedent
- `brioela-specs/21-onboarding.md` — inheritance-entry path
- `brioela-specs/38-food-time-machine.md` — generational recipe moments
- `brioela-specs/19-pricing-and-tiers.md` — Chef/Culina gates
- `build-guide/08-cooking-session/00-overview.md` — capture in session folder
- `build-guide/24-viral-sharing/04-feature-specific-card-types.md` — preservation card
- `build-guide/36-harvest/02-chapter-rules.md` — heritage chapter

### Neighbor feature migrations

- `_features/29-cooking-session/spec.md`
- `_features/43-pricing-tiers/spec.md`
- `_features/48-encore/spec.md` (G33/G34 boundary)
- `_features/25-recipe-ingestion/spec.md`
- `_features/51-viral-sharing/status.md`

### Ledgers

- `_records/connections/31-heirloom-connections.md`
- `_records/build-order/32-layer-heirloom.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
