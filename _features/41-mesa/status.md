# Status

open

**Mesa not shipped.** Build-guide **26-mesa** is complete (docs only). Zero Mesa Brain tables, zero Food Audience primitive, zero compatibility engine, zero Mesa tools, zero invite/contribution delivery, zero mobile Mesa surfaces. Partial: `constraints` table + tools (**07**) — personal profile only; no `mesa_*` schemas anywhere in `backend/src`, `shared/`, or `mobile/`.

# Shipped in backend (partial / unrelated)

- [x] `constraints` table + constraint tools (**07**) — `just_me` audience input only
- [x] `build-guide/26-mesa/` (11 files) — docs complete per session 030
- [x] `brioela-specs/41-mesa.md` — spec marked complete in inventory
- [x] Pricing policy captured: +$8/mo, Viva includes, 8 active members (session 031)
- [ ] `mesa` / `mesa_member` / `mesa_constraint` tables
- [ ] `mesa_food_audience` / `mesa_potential_member` tables
- [ ] `mesa_invite` / `mesa_contribution_event` tables
- [ ] Mesa Zod validators (`shared/validator/mesa/`)
- [ ] `tools/mesa/*` AI-callable tools
- [ ] `evaluateMesaCompatibility` helper
- [ ] `loadActiveFoodAudience` helper
- [ ] Cross-brain contributor → owner DO delivery
- [ ] Mesa entitlement gate (**43**)
- [ ] Scanner Mesa compatibility row (**24** hook)
- [ ] Meal plan Mesa audience input (**34** hook)
- [ ] Mobile `features/mesa/`
- [ ] Mesa tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **Cross-brain invite/contribution delivery undefined** | `mesa_invite` + `mesa_contribution_event` live in owner's DO only; no RPC/queue spec for contributor account writes |
| G2 | No Mesa Brain schemas | `rg mesa_ backend/src/agents/brain/_schemas` — zero |
| G3 | No `shared/validator/mesa/` | `rg mesa.schema shared/validator` — zero |
| G4 | No `tools/mesa/` directory | `03-mesa-tools.md` — not in **19** registry |
| G5 | No `evaluateMesaCompatibility` | `05-food-audience-compatibility-engine.md` — not built |
| G6 | No `loadActiveFoodAudience` | `04-food-audience.md` — not built |
| G7 | No `set_food_audience` persistence | `mesa_food_audience` table missing |
| G8 | No conversational Mesa setup handlers | `02-conversational-setup.md` — agent-only design |
| G9 | No `create_mesa` / member tools | `03-mesa-tools.md` — zero implementations |
| G10 | No hard-constraint confirmation gate | Tool requires `confirmedByOwner` — no enforcement code |
| G11 | No potential-member inference pass | `08-potential-members.md` + **35** guest archive unwired |
| G12 | No 14-day prompt cap enforcement | `08-potential-members.md` policy — no code |
| G13 | No `mesa_invite` flow | `07-shared-enrichment-and-invites.md` — not built |
| G14 | No contribution review queue | Owner-review for hard constraints — not built |
| G15 | No shared pantry enrichment apply | Accepted `pantry_item` contributions — no handler |
| G16 | No Mesa entitlement helper | `10-tiering-and-rollout.md` + **43** unwired |
| G17 | No 8 active member cap | Policy in `02-tier-entitlements.md` — no code |
| G18 | No scanner Mesa row hook | **24** unshipped; **41** adapter missing |
| G19 | No meal plan Mesa audience input | **34** unshipped; `06-feature-integration.md` unwired |
| G20 | No menu Mesa dish rank | **26** unshipped |
| G21 | No Bela Mesa audience hook | **42** unshipped |
| G22 | No cooking session audience ask | **29** unshipped |
| G23 | No `guest_session` compose with Mesa | **35** `guest_session` table not shipped |
| G24 | No Passport `mesa_table` blocks builder | **47** unshipped |
| G25 | No viral Mesa Compatibility Card data | **51** unwired |
| G26 | No `mesa_member_row` grammar feed | **52** unwired |
| G27 | No mobile `features/mesa/` | `rg mesa mobile/features` — zero |
| G28 | Practitioner Mesa access blocked by policy only | **46** `05-client-and-practitioner-boundary.md` — no API guard |
| G29 | No Mesa export/delete handler | `09-privacy-permissions.md` — Passport category missing |
| G30 | No `mesa_pantry` table (by design) | Shared context = contributions; document **34** read contract |
| G31 | Spec 41 open questions partially stale | Tier/add-on decided in session 031; spec prose still lists Core/Chef/Power |
| G32 | Session 030 "shipped feature" misleading | Docs-only completion |
| G33 | No implementable-specs Mesa entries | `rg mesa implementable-specs` — zero |
| G34 | No Mesa tests | No `mesa*.test.ts` |
| G35 | **04** per-user DO assumption | All Mesa in owner DO — contributor flows need platform design (G1) |
| G36 | `medical_watchlist` in Mesa vs **23** conditions | Entity alignment not coded |
| G37 | In-store copilot Mesa checks | **45** blocked; audience read missing |
| G38 | Tonight `mesa_audience` source | **54** blocked |

# 41 vs neighbor boundaries

| In **41** (this feature) | In separate feature |
|---|---|
| Mesa tables + Food Audience | Per-user Brain DO routing — **04** |
| `mesa_constraint` per-member | Personal `constraints` — **07** |
| Compatibility engine | Scan pipeline — **24** |
| Shared enrichment contributions | Personal inventory — **34** |
| Audience `guest_session` compose | `guest_session` lifecycle — **35** |
| Mesa tier gate | Tier catalog — **43** |
| Child member policy | Kids co-scan — **44** |
| No practitioner Mesa reads | Verified profiles — **46** |
| `mesa_table` block builder | Passport render — **47** |
| Compatibility card facts | Viral scrub — **51** |
| `mesa_member_row` data | Grammar renderer — **52** |

# Critical boundary: owner Brain DO vs multi-account

| | **Owner Brain DO** | **Contributor account** |
|---|---|---|
| **Authoritative Mesa state** | Yes — all `mesa_*` tables | No — private brain stays private |
| **Writes** | Owner tools + accepted contributions | Scoped events only via delivery (G1) |
| **Reads** | Full Mesa for owner | Scoped per invite permissions |
| **Risk** | Treating Mesa as replicated per account | Must not copy Mesa into contributor DO |

# Critical boundary: Mesa vs personal pantry

| | **34 personal pantry** | **41 Mesa shared context** |
|---|---|---|
| **Tables** | `inventory_item_estimate`, snapshots, patterns | `mesa_contribution_event` |
| **Model** | Probabilistic | Explicit accepted contributions |
| **Meal plan** | Owner inventory input | Audience + enrichment read |

# Blocked by

- 01-platform-foundation (API router, cross-user RPC)
- 04-brain-foundation (Brain SQLite migrations)
- 07-brain-constraint-tools (personal constraints — partial ✓)
- 19-brain-tool-registry (Mesa tool registration)
- 24-scanner (first compatibility surface)
- 34-pantry-meal-plan (Mesa meal-plan + enrichment read)
- 35-ambient-intelligence (`guest_session` + potential signals)
- 23-medical-conditions (`medical_watchlist` alignment)
- 43-pricing-tiers (Mesa entitlement)
- 21-platform-notifications (invite delivery)
- 03-platform-auth-onboarding (invitee identity)

# Blocks

- 34-pantry-meal-plan (Mesa audience on plan generate — partial boundary)
- 42-bela (Mesa order audience)
- 45-in-store-copilot (shelf Mesa checks)
- 47-passport (`mesa_table` kind)
- 51-viral-sharing (Mesa Compatibility Card)
- 52-generative-grammar (`mesa_member_row`)
- 54-tonight (`mesa_audience` source)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `_records/session-log/030-mesa-complete.md` | "First-class shipped feature" — docs only |
| `brioela-specs/41-mesa.md` § Tiering open questions | Partially resolved by session 031 (+$8, Viva, 8 members) |
| `build-guide/26-mesa/10-tiering-and-rollout.md` § Shipping Scope | Phase 1 vs 2 ordering ambiguous |
| Cross-brain mechanics | Tables assume owner DO; invite accept path not in implementable-specs |
| "shared pantry" prose | No `mesa_pantry` table — contributions + **34** read |

# Draft count

**23** files in `draft/` — 22 gap/intended snapshots + `gap-index.md`.

# Sources

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
- `_features/04-brain-foundation/status.md`
- `_features/07-brain-constraint-tools/status.md`
- `_features/34-pantry-meal-plan/status.md`
- `_features/35-ambient-intelligence/status.md`
- `_features/43-pricing-tiers/status.md`
- `_features/46-verified-profiles/status.md`
