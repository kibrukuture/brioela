# Mesa — Spec

Feature **41**. Multi-person food intelligence: Food Audience evaluation across products, recipes, menus, meal plans, Bela orders, and cooking sessions; owner-managed Mesa members and per-member constraints in Brain DO SQLite; conversational no-form setup; compatibility engine with per-member verdicts; scoped invited-contributor enrichment; potential-member inference; tier gating. Mesa means the table — not "Family Account" or "Household" in user-facing copy.

**Not in this feature:** Per-user personal `constraints` DDL and tools (**07** — Mesa consumes parallel `mesa_constraint` rows); personal pantry inventory model (**34** — Mesa reads for planning; shared pantry enrichment via contributions only); temporary `guest_session` lifecycle (**35** — audience mode `guest_session` composes with Mesa); Kids Mode tone/supervised co-scan (**44** — Mesa may supply child member constraints if owner created them); practitioner-client consent reads (**46** — no Mesa member data without future explicit scope); Passport generation body (**47** — consumes Mesa audience); viral sharing card scrub (**51** — Mesa owns compatibility; sharing owns privacy rewrite); generative grammar renderer (**52** — `mesa_member_row` primitive); in-store co-pilot session shell (**45** — reads active audience); Bela order state machine (**42** — consumer of active audience); guard/lexicon/reading-gate tooling.

**Living catalog note:** `FoodAudience.mode` values (`just_me` | `mesa` | `selected_members` | `guest_session`) are the cross-feature primitive. Mesa tables live in the **Mesa owner's** Brain DO — not Supabase, not Ground.

---

## Purpose

Most food decisions are not individual. A parent shops for five people; a caregiver manages an elder's diet; a partner scans groceries for the whole home. Brioela's default question is "Is this good for me?" Mesa changes it to "Who can eat this, who should avoid it, and what works for everyone at this table?"

Without **41**, every scan, plan, menu rank, and Bela substitution evaluates only the signed-in user's personal constraints. Multi-person compatibility, shared grocery context, and invited contributor enrichment have no data home.

---

## Product definition

| Term | Meaning |
|---|---|
| **Mesa** | Product name for multi-person food coordination — the food audience layer. User-facing copy never says "Family Account" or "Household". |
| **Food Audience** | Active evaluation context: who the current food decision is for. |
| **Mesa member** | Lightweight food profile (label, role, age band) — not necessarily a Brioela account. |
| **Mesa constraint** | Per-member hard/soft rule (allergy, intolerance, dietary identity, dislike, medical watchlist, boycott). |
| **Mesa owner** | Signed-in user whose Brain DO stores Mesa tables. |
| **Invited contributor** | Another Brioela account that may contribute scoped events (scans, pantry items) — not their whole brain. |
| **Shared enrichment** | Explicit, permissioned contribution of selected food events into Mesa context. |
| **Potential member** | Inferred candidate from repeated patterns — never an active member until owner confirms. |
| **Compatibility result** | Per-member verdicts + overall `works_for_all` / `works_for_some` / `ask_or_modify` / `avoid_for_mesa`. |
| **Shared pantry (Mesa scope)** | Accepted `mesa_contribution_event` rows with `entity_kind: pantry_item` — not a fork of **34**'s probabilistic inventory model. |

**Design principle (non-negotiable):** Mesa does not average people. One hard conflict for one member remains a hard conflict for that member. Invited contributors share selected events, not their entire private Brioela memory.

**Phased account model (spec 41):**

1. **Owner-managed Mesa** — one account manages members locally (launch minimum).
2. **Invited contributor** — another account contributes scoped scans/events.
3. **Full shared Mesa** — multiple accounts with role-based permissions (later).

Start with phase 1. Do not block Mesa on complex family-account auth.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/26-mesa/`, `brioela-specs/41-mesa.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/04`, `07`, `24`, `34`, `35`, `42`, `43`, `44`, `46`, `47`, `51`, `52`.

| # | Component | Type | In **41**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **`mesa` table** | Brain SQLite | **Yes** | No | Owner creates Mesa | `01-mesa-data-model.md` |
| 2 | **`mesa_member` table** | Brain SQLite | **Yes** | No | Conversational add/archive | `01`, `02` |
| 3 | **`mesa_constraint` table** | Brain SQLite | **Yes** | No | Per-member rules | `01`, `03` |
| 4 | **`mesa_food_audience` table** | Brain SQLite | **Yes** | No | Sticky session context | `04-food-audience.md` |
| 5 | **`mesa_potential_member` table** | Brain SQLite | **Yes** | No | Pattern inference candidates | `08-potential-members.md` |
| 6 | **`mesa_invite` table** | Brain SQLite | **Yes** | No | Contributor invites | `07-shared-enrichment-and-invites.md` |
| 7 | **`mesa_contribution_event` table** | Brain SQLite | **Yes** | No | Scoped shared enrichment | `07` |
| 8 | **Conversational Mesa setup** | Agent flow | **Yes** | No | No forms | `02-conversational-setup.md` |
| 9 | **Mesa AI tools (`tools/mesa/`)** | Brain tool registry | **Yes** | No | Only mutation path | `03-mesa-tools.md` |
| 10 | **Food Audience modes** | Cross-feature primitive | **Yes** | No | `set_food_audience` tool | `04-food-audience.md` |
| 11 | **Compatibility engine** | Brain helper | **Yes** | No | `evaluate_mesa_compatibility` | `05-food-audience-compatibility-engine.md` |
| 12 | **Per-member verdict aggregation** | Engine rule | **Yes** | No | Never average hard conflicts | `05` |
| 13 | **Substitution suggestions** | Engine output | **Yes** | No | One low-intervention swap | `05`, `06` |
| 14 | **Scanner Mesa row** | **24** consumer | **Cross** | No | Post-scan compatibility strip | `06-feature-integration.md` |
| 15 | **Recipe Mesa check** | **08**/**25** consumer | **Cross** | No | Audience-filtered import | `06` |
| 16 | **Menu dish Mesa rank** | **26** consumer | **Cross** | No | Whole-table dishes | `06` |
| 17 | **Meal plan Mesa audience input** | **34** consumer | **Cross** | No | Hard-filter + prefer all-green | `06` |
| 18 | **Bela Mesa audience** | **42** consumer | **Cross** | No | Shopper "not OK for Mesa" | `06` |
| 19 | **Cooking session audience ask** | **29** consumer | **Cross** | No | Once per session | `06` |
| 20 | **Kids Mode member constraints** | **44** consumer | **Partial** | No | Owner-created child members only | `06`, `09` |
| 21 | **Potential member inference** | Ambient + Mesa pass | **Yes** | No | 3+ events threshold | `08`, **35** guest archive |
| 22 | **Invite flow + scopes** | API + tools | **Yes** | No | Owner confirms | `07` |
| 23 | **Contribution acceptance queue** | Handler | **Yes** | No | Owner-review for hard constraints | `07` |
| 24 | **Shared pantry enrichment** | Contribution apply | **Yes** | No | Accepted `pantry_item` events | `07`, spec 41 |
| 25 | **Revocation + data ownership rules** | Policy | **Yes** | No | Shared objects vs member facts | `07`, `09` |
| 26 | **Child permission restrictions** | Policy | **Yes** | No | No child accounts implied | `09-privacy-permissions.md` |
| 27 | **Medical/wearable boundaries** | Policy | **Yes** | No | Never default-share to Mesa | `09`, **23** |
| 28 | **Mesa export category** | Passport/delete | **Cross** | No | Explicit Mesa export | `09`, **47** |
| 29 | **Mesa entitlement gate** | **43** consumer | **Yes** | No | +$8/mo or Viva | `10-tiering-and-rollout.md` |
| 30 | **8 active member limit** | Policy | **Yes** | No | Archived excluded | `10`, `25-pricing-tiers/02` |
| 31 | **Mesa Compatibility Card** | **51** consumer | **Cross** | No | Privacy-scrubbed share | `24-viral-sharing/04` |
| 32 | **`mesa_member_row` grammar primitive** | **52** consumer | **Cross** | No | Per-member verdict UI | `27-generative-grammar/14` |
| 33 | **Passport `mesa_table` kind** | **47** consumer | **Cross** | No | Table instruction blocks | `brioela-specs/43-passport.md` |
| 34 | **In-store copilot Mesa checks** | **45** consumer | **Cross** | No | Shelf pickup compatibility | `brioela-specs/45-in-store-copilot.md` |
| 35 | **Tonight `mesa_audience` source** | **54** consumer | **Cross** | No | Answer generation input | `38-tonight/03-learning-loop.md` |
| 36 | **Practitioner Mesa boundary** | **46** policy | **No** | No | No Mesa access without future design | `23-verified-profiles/05` |
| 37 | **Cross-brain invite delivery** | Platform RPC | **Yes** | No | Contributor ≠ owner DO | **Dangerous gap** — see Architecture |
| 38 | **Mobile Mesa compatibility surfaces** | Mobile UI | **Yes** | No | Scan/plan/menu rows | `06` |
| 39 | **Personal `constraints` table** | **07** | **No** | Partial | Signed-in user only | `01` relationship rules |
| 40 | **`guest_session` table** | **35** | **No** | No | Temporary overlay | spec 37 |
| 41 | **Personal pantry tables** | **34** | **No** | No | Owner inventory model | **34** spec |

### Shipped in repo today (mesa-related)

- `build-guide/26-mesa/` — **11 files complete** (docs only).
- `brioela-specs/41-mesa.md` — primary spec.
- `_records/connections/18-mesa-connections.md`, `_records/build-order/20-layer-mesa.md`.
- `_records/session-log/030-mesa-complete.md`, `031-mesa-policy-decisions.md`.
- `constraint` table + tools (**07**) — personal constraints only; no `mesa_*` tables.
- **`rg 'mesa_|mesa\.|FoodAudience|evaluateMesa|mesa_member' backend/src shared/ mobile/`** — zero product matches (lexicon guard only).

---

## Architecture — owner Brain DO vs invited contributors

```text
Mesa owner's Brain DO (canonical store)
  ├── mesa, mesa_member, mesa_constraint
  ├── mesa_food_audience (active + history)
  ├── mesa_potential_member, mesa_invite
  └── mesa_contribution_event (accepted shared objects)

Signed-in user's personal layer (unchanged)
  ├── constraints (**07**) — "just_me" audience
  ├── guest_session (**35**) — temporary overlay; audience mode guest_session
  └── inventory_item_estimate (**34**) — personal pantry; NOT duplicated for Mesa

Food decision surface (scan, recipe, menu, plan, Bela, cook)
        │
        ▼
loadActiveFoodAudience(ownerUserId)
        │
        ├── just_me → personal constraints only
        ├── mesa | selected_members → merge mesa_constraint for memberIds
        └── guest_session → merge guest_session constraints (+ optional Mesa)
        │
        ▼
evaluateMesaCompatibility(entity, audience)
        │
        ├── per-member verdict (green | yellow | red)
        ├── overall bucket (works_for_all | …)
        └── optional substitution suggestion (user must accept)

Invited contributor (another account) — DANGEROUS BOUNDARY
  Contributor Brain DO stays private
        │
        ▼
  Scoped event (scan marked for Mesa, pantry_item)
        │
        ▼
  Delivery to owner's Brain DO (RPC / queue — NOT SPECIFIED IN BUILD GUIDE)
        │
        ▼
  mesa_contribution_event (accepted_by_owner flag)
        │
        └── Accepted pantry_item → Mesa shared context (**34** reads; does not fork model)
```

**Critical rule:** Mesa data lives in the **owner's** per-user Brain DO. Invited contributors do **not** get a copy of Mesa state in their own DO for authoritative writes. Cross-account invite accept and contribution delivery require an explicit platform mechanism (notification + owner-brain RPC). Build guide tables assume rows land in owner's SQLite — implementation must not silently replicate Mesa into contributor brains.

---

## Data model (Brain DO SQLite — owner's DO only)

| Table | Role |
|---|---|
| `mesa` | `id`, `owner_user_id`, `display_name`, `status` (active \| archived), timestamps |
| `mesa_member` | `id`, `mesa_id`, `label`, `role`, `age_band`, `linked_user_id` nullable, `status` |
| `mesa_constraint` | Per-member constraint rows; `confirmed_by_owner`; `source`; `active` |
| `mesa_food_audience` | Active/historical audience rows; `member_ids_json`; optional `expires_at` |
| `mesa_potential_member` | Inferred candidates; `evidence_json`; `confidence`; `status` |
| `mesa_invite` | `invitee_user_id` / `invitee_contact_hash`; `scopes_json`; `status` |
| `mesa_contribution_event` | Contributor events; `entity_kind`; `payload_json`; `accepted_by_owner` |

**Relationship to existing tables (`01-mesa-data-model.md`):**

- `constraints` — signed-in user's personal profile; unchanged by Mesa member edits.
- `mesa_constraint` — active only when Food Audience includes that member.
- `guest_session` — temporary; recurring patterns may become `mesa_potential_member`, not auto-members.
- No separate `mesa_pantry` table — shared pantry is accepted contribution events + **34** read path.

---

## Food Audience

```typescript
type FoodAudience = {
  mode: 'just_me' | 'mesa' | 'selected_members' | 'guest_session'
  mesaId: string | null
  memberIds: string[]
  source: 'explicit' | 'inferred' | 'session_default'
  expiresAt: number | null
}
```

**Selection:** Conversational and sticky within session. Do not ask "who is this for?" on every scan.

**Expiry examples:** `selected_members` for cooking session → session end; `guest_session` → guest archive; grocery Mesa run → hours/session.

**Composition:** `guest_session` can combine with Mesa ("Mesa plus my friend tonight").

---

## Compatibility engine

**Result shape (`05-food-audience-compatibility-engine.md`):**

- `overall`: `works_for_all` | `works_for_some` | `ask_or_modify` | `avoid_for_mesa`
- `memberResults[]`: per-member `verdict`, `reason`, `matchedConstraints`, optional `suggestedSubstitution`

**Rules:**

- Every green → `works_for_all`
- Mix of green and red → `works_for_some` with explicit "avoid for [label]"
- Yellow only or fixable via substitution → `ask_or_modify`
- Multiple reds or protected child/elder hard conflict → `avoid_for_mesa`
- Low label/menu confidence + any hard constraint → yellow/red, never false green

**Substitutions:** Show original conflict; suggest one swap; require user acceptance for recipe variants.

---

## Conversational setup (`02-conversational-setup.md`)

- No long forms or family tree builders.
- Confirm before: first Mesa, hard constraints, member archive, invites, contribution scopes.
- Language: "keep in mind", "check food for", "include at your table" — never "track your family".

Entry points: upgrade moment, scan "check for everyone", meal plan, cooking, menu scan, settings (conversational).

---

## Mesa tools (`03-mesa-tools.md`)

All mutations via Zod-validated tools under `tools/mesa/` — no direct LLM SQLite writes.

| Tool | Writes |
|---|---|
| `create_mesa` | `mesa` |
| `add_mesa_member` / `update_mesa_member` / `archive_mesa_member` | `mesa_member` |
| `add_mesa_constraint` / `update_mesa_constraint` | `mesa_constraint` |
| `set_food_audience` | `mesa_food_audience` |
| `evaluate_mesa_compatibility` | read-only |
| `create_mesa_invite` | `mesa_invite` |
| `accept_mesa_contribution` | `mesa_contribution_event` |
| `propose_potential_member` / `dismiss_potential_member` | `mesa_potential_member` |

Hard constraints require `confirmedByOwner = true` before filtering use.

Potential-member tools cannot create active members.

---

## Shared enrichment and invites (`07`)

**Roles:** `adult_member` | `caregiver` | `guest_contributor`

**Scopes:** `scan_results`, `confirmed_purchases`, `pantry_items`, `meal_feedback`, `recipe_feedback`

**Blocked by default from contributor brain:** private constraints, medical conditions, wearables, full scan history, private notes, location trails.

**Acceptance:** Pantry items / bought scans may auto-apply if scope allows. New hard constraints from contributors queue for owner confirmation.

**Revocation:** Stop future contribution; accepted shared objects may remain; personal/member facts removable per policy.

---

## Potential members (`08`)

Candidate threshold: ≥3 meaningful events OR ≥2 high-confidence recurring sessions, spanning >1 day; prompt at most once per 14 days.

Dismiss → suppress 30 days. Accept → conversational setup + tools.

Evidence sources: guest session overlap, cooking mentions, meal plan "for the kids", partner dairy corrections, etc.

---

## Privacy and permissions (`09`)

- Mesa private by default — no Ground/map/public publish.
- Child members ≠ child accounts; no purchases, invites, external share, adult health visibility.
- Medical conditions: owner confirmation; no default exposure to contributors.
- Wearables never shared into Mesa by default.
- **46** practitioners cannot access Mesa member data without future explicit Mesa permission design.

---

## Tiering (`10`, **43**)

| Policy | Value |
|---|---|
| Positioning | Multi-person Food Audience; "for everyone at your table" |
| Price | +$8/month add-on; **included in Viva** |
| Member limit | Up to **8 active** members (archived excluded) |
| Free tier | Solo scan safety for signed-in user remains free |

Mesa includes: audience evaluation, works-for-everyone compatibility, Mesa meal/grocery planning, invited contributor enrichment.

---

## Feature integration summary

| Surface | Mesa behavior |
|---|---|
| **Scanner (24)** | Post-verdict Mesa row: works for everyone / avoid for [label] |
| **Recipes (08/25)** | Import check vs audience; Mesa-safe variant as note, not overwrite |
| **Menu (26)** | Rank dishes for whole table; waiter questions if none fit all |
| **Meal plan (34)** | Audience input; hard exclude; prefer all-green; list marks per-member items |
| **Bela (42)** | Active audience for substitutions; shopper scanner Mesa warnings |
| **Cooking (29)** | Once-per-session audience ask; step-level substitution hints |
| **Kids (44)** | Co-scan supervised; Mesa supplies child constraints if owner created |
| **Passport (47)** | `mesa_table` kind from active audience |
| **Viral (51)** | Mesa Compatibility Card — scrubbed member names |
| **Grammar (52)** | `mesa_member_row` domain primitive |
| **Tonight (54)** | `mesa_audience` answer source |
| **In-store (45)** | Shelf pickup Mesa compatibility |

---

## 41 vs neighbor boundaries

| In **41** (this feature) | In separate feature |
|---|---|
| Mesa tables + tools + audience | Personal `constraints` DDL/tools — **07** |
| `mesa_constraint` per-member rules | Medical condition profiles — **23** |
| Compatibility engine + verdict shape | Product scan pipeline — **24** |
| Shared enrichment via contributions | Personal inventory estimate — **34** |
| Food Audience primitive | `guest_session` lifecycle — **35** |
| Invite/contribution policy | Push delivery — **21** |
| Mesa entitlement gate | Tier catalog — **43** |
| Conversational member setup | Kids co-scan tone — **44** |
| Privacy scrub rules for share | Viral card generation — **51** |
| `mesa_member_row` data contract | Grammar renderer — **52** |
| Practitioner Mesa ban | Verified profiles — **46** |
| Owner Brain DO storage | Per-user DO routing — **04** |

### Critical boundary: personal vs Mesa vs guest

| | **Personal constraints** | **Mesa member constraints** | **Guest session** |
|---|---|---|---|
| **Storage** | `constraints` (**07**) | `mesa_constraint` (**41**) | `guest_session` (**35**) |
| **Persistence** | Permanent profile | Owner-managed members | Temporary until archive |
| **Audience mode** | `just_me` | `mesa` / `selected_members` | `guest_session` |
| **Identity** | Signed-in user | Label + role (no legal name required) | Unnamed constraint set only |
| **Promotion** | N/A | From `mesa_potential_member` | Archive → memory / Mesa suggest |

### Critical boundary: personal pantry vs Mesa shared context

| | **Personal pantry (34)** | **Mesa shared enrichment (41)** |
|---|---|---|
| **Question** | What is likely at home for this user? | What did trusted contributors add for the table? |
| **Storage** | `inventory_item_estimate`, snapshots, patterns | `mesa_contribution_event` accepted rows |
| **Model** | Probabilistic inventory | Explicit contributed objects |
| **Owner** | **34** assemble + plan | **41** accept; **34** may read for Mesa meal plan |

---

## Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `brioela-specs/41-mesa.md` § Open Product Questions | Partially superseded by session 031: +$8/mo, Viva includes, 8 members — tier placement still says "Core/Chef/Power" in spec prose |
| `build-guide/26-mesa/10-tiering-and-rollout.md` § Shipping Scope | Lists invited contributors + Bela in one block — phase 1 vs 2 ordering ambiguous for implementation |
| Cross-brain invite/contribution delivery | Tables in owner's DO only; no implementable-spec for contributor→owner RPC |
| `_records/session-log/030-mesa-complete.md` | "Mesa is a first-class shipped feature" — docs only, zero production code |
| `implementable-specs/` | No Mesa entries |
| Spec 41: "shared pantry item" | No `mesa_pantry` table — contributions + **34** read path |
| **35** `guest_session` vs Mesa `guest_session` mode | Same string, different layers — compose, do not merge tables |

---

## Success metrics (from spec 41)

- Mesa creation rate among users with kids/household signals.
- Scan audience selection rate.
- Compatibility actions: works-for-all, avoid-for-member, substitution accepted.
- Meal plan generation for Mesa audience.
- Invite acceptance rate (when contributor mode ships).
- Retention difference for Mesa vs single-profile users.

---

## Sources

- `build-guide/26-mesa/` (00–10)
- `brioela-specs/41-mesa.md`
- `brioela-specs/37-guest-and-cooking-for-others.md`
- `brioela-specs/31-kids-food-literacy-mode.md`
- `brioela-specs/43-passport.md`
- `brioela-specs/45-in-store-copilot.md`
- `build-guide/25-pricing-tiers/02-tier-entitlements.md`, `05-metered-and-add-ons.md`
- `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`
- `build-guide/24-viral-sharing/03-privacy-scrub-and-consent.md`, `04-feature-specific-card-types.md`
- `build-guide/27-generative-grammar/14-primitive-layers-and-reuse.md`
- `build-guide/38-tonight/03-learning-loop.md`
- `_records/connections/18-mesa-connections.md`
- `_records/build-order/20-layer-mesa.md`
- `_records/session-log/030-mesa-complete.md`, `031-mesa-policy-decisions.md`
- `_features/04-brain-foundation/spec.md`
- `_features/07-brain-constraint-tools/status.md`
- `_features/34-pantry-meal-plan/spec.md`
- `_features/35-ambient-intelligence/spec.md`
- `_features/43-pricing-tiers/status.md`
- `_features/46-verified-profiles/status.md`
