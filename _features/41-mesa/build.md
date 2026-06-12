# Mesa — Build

Feature **41**. Production paths under `backend/src/agents/brain/_schemas/mesa.*.ts`, `backend/src/agents/brain/_handlers/mesa/`, `backend/src/agents/brain/_helpers/mesa/`, `backend/src/agents/brain/tools/mesa/`, `shared/validator/mesa/`, `shared/routes/mesa.routes.ts`, optional `backend/src/api/mesa/` for invite accept webhooks, and `mobile/features/mesa/`. All Mesa authoritative state in **owner's** Brain DO SQLite.

**Scope:** Mesa/member/constraint/audience/potential/invite/contribution tables, Zod validators, AI-callable Mesa tools, compatibility engine, conversational setup flows (agent), entitlement gate, contribution acceptance, potential-member inference hook, integration adapters for scan/recipe/menu/plan/Bela/cook, mobile compatibility rows. **Not in 41 build:** personal `constraints` tools (**07**), `guest_session` table (**35**), personal pantry tables (**34**), product scan pipeline (**24**), meal plan generation body (**34**), Bela orders (**42**), Passport PDF generation (**47**), viral card scrub (**51**), grammar renderer (**52**), practitioner scopes (**46**), cross-account notification transport detail (**21** + platform — design gap G1).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/26-mesa/` (11 files) | ✓ docs only |
| `brioela-specs/41-mesa.md` | ✓ spec |
| `_records/connections/18-mesa-connections.md` | ✓ ledger |
| `_records/build-order/20-layer-mesa.md` | ✓ ledger |
| `_records/session-log/030-mesa-complete.md`, `031-mesa-policy-decisions.md` | ✓ session logs |
| `constraints` table + tools (**07**) | ✓ personal only |
| Mesa Brain tables / tools / handlers | ✗ |
| Food Audience / compatibility engine | ✗ |
| Invite + contribution delivery | ✗ |
| Mobile `features/mesa/` | ✗ |
| Mesa tests | ✗ |

**Zero Mesa production code.** `rg 'mesa_|mesa\.|FoodAudience|evaluateMesa' backend/src shared/ mobile/` — no matches (lexicon guard excluded).

---

## File manifest

### Shared validator + routes (**41**)

| File | Role |
|---|---|
| `shared/validator/mesa/food.audience.schema.ts` | `FoodAudience` + mode enums |
| `shared/validator/mesa/mesa.member.schema.ts` | Member role/age_band |
| `shared/validator/mesa/mesa.constraint.schema.ts` | Constraint types + severity |
| `shared/validator/mesa/mesa.compatibility.result.schema.ts` | Engine output shape |
| `shared/validator/mesa/mesa.invite.schema.ts` | Invite roles + scopes |
| `shared/validator/mesa/mesa.contribution.schema.ts` | Contribution event payload |
| `shared/validator/mesa/mesa.potential.member.schema.ts` | Candidate evidence |
| `shared/validator/mesa/index.ts` | Barrel |
| `shared/routes/mesa.routes.ts` | `MESA_ROUTES` invite accept, audience read |

### Brain SQLite schemas (**41** — owner DO)

| File | Role |
|---|---|
| `_schemas/mesa.schema.ts` | `mesa` header |
| `_schemas/mesa.member.schema.ts` | `mesa_member` |
| `_schemas/mesa.constraint.schema.ts` | `mesa_constraint` |
| `_schemas/mesa.food.audience.schema.ts` | `mesa_food_audience` |
| `_schemas/mesa.potential.member.schema.ts` | `mesa_potential_member` |
| `_schemas/mesa.invite.schema.ts` | `mesa_invite` |
| `_schemas/mesa.contribution.event.schema.ts` | `mesa_contribution_event` |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add Mesa tables to Brain chain |

### Brain tools — `tools/mesa/` (**41**)

| File | Role |
|---|---|
| `tools/mesa/create.mesa.tool.ts` | `create_mesa` |
| `tools/mesa/add.mesa.member.tool.ts` | `add_mesa_member` |
| `tools/mesa/update.mesa.member.tool.ts` | `update_mesa_member` |
| `tools/mesa/archive.mesa.member.tool.ts` | `archive_mesa_member` |
| `tools/mesa/add.mesa.constraint.tool.ts` | `add_mesa_constraint` |
| `tools/mesa/update.mesa.constraint.tool.ts` | `update_mesa_constraint` |
| `tools/mesa/set.food.audience.tool.ts` | `set_food_audience` |
| `tools/mesa/evaluate.mesa.compatibility.tool.ts` | read-only compatibility |
| `tools/mesa/create.mesa.invite.tool.ts` | `create_mesa_invite` |
| `tools/mesa/accept.mesa.contribution.tool.ts` | owner accepts event |
| `tools/mesa/propose.potential.member.tool.ts` | candidate only |
| `tools/mesa/dismiss.potential.member.tool.ts` | suppress candidate |
| `tools/mesa/index.ts` | Barrel → **19** registry |

### Brain helpers — audience + compatibility (**41**)

| File | Role |
|---|---|
| `_helpers/mesa/load.active.mesa.helper.ts` | Owner's active Mesa header |
| `_helpers/mesa/load.active.food.audience.helper.ts` | Current audience + expiry |
| `_helpers/mesa/resolve.audience.member.ids.helper.ts` | Expand mesa / selected / guest compose |
| `_helpers/mesa/merge.constraints.for.audience.helper.ts` | Personal + mesa + guest layers |
| `_helpers/mesa/evaluate.mesa.compatibility.helper.ts` | Per-member verdicts + overall |
| `_helpers/mesa/suggest.mesa.substitution.helper.ts` | One swap suggestion |
| `_helpers/mesa/aggregate.mesa.overall.verdict.helper.ts` | works_for_all rules |
| `_helpers/mesa/check.mesa.entitlement.helper.ts` | **43** gate + 8-member cap |
| `_helpers/mesa/count.active.mesa.members.helper.ts` | Limit enforcement |
| `_helpers/mesa/index.ts` | Barrel |

### Brain handlers — lifecycle + enrichment (**41**)

| File | Role |
|---|---|
| `_handlers/mesa/create.mesa.handler.ts` | First Mesa + owner self member |
| `_handlers/mesa/add.mesa.member.handler.ts` | Member + optional constraints |
| `_handlers/mesa/set.food.audience.handler.ts` | Persist audience row |
| `_handlers/mesa/create.mesa.invite.handler.ts` | Invite row + platform notify |
| `_handlers/mesa/accept.mesa.invite.handler.ts` | Invitee accept → link `linked_user_id` |
| `_handlers/mesa/submit.mesa.contribution.handler.ts` | Contributor → owner DO RPC |
| `_handlers/mesa/review.mesa.contribution.handler.ts` | Owner accept/reject queue |
| `_handlers/mesa/apply.mesa.pantry.enrichment.helper.ts` | Accepted pantry_item → Mesa context |
| `_handlers/mesa/propose.potential.member.handler.ts` | Inference from **35** guest/cooking signals |
| `_handlers/mesa/prompt.potential.member.handler.ts` | 14-day cap surfacing |
| `_handlers/mesa/revoke.mesa.invite.handler.ts` | Stop contributor access |
| `_handlers/mesa/delete.mesa.data.handler.ts` | Passport category + archive Mesa |
| `_handlers/mesa/index.ts` | Barrel |

### Cross-feature integration adapters (**41** owns adapter; surface owns pipeline)

| File | Role |
|---|---|
| `_helpers/mesa/attach.mesa.scan.verdict.helper.ts` | **24** post-scan row |
| `_helpers/mesa/check.recipe.mesa.compatibility.helper.ts` | **08**/**25** import |
| `_helpers/mesa/rank.menu.dishes.for.mesa.helper.ts` | **26** menu rank |
| `_helpers/mesa/build.mesa.meal.plan.input.helper.ts` | **34** generate input |
| `_helpers/mesa/build.bela.mesa.constraints.helper.ts` | **42** order audience |
| `_helpers/mesa/build.cooking.mesa.context.helper.ts` | **29** session prompt |
| `_helpers/mesa/build.passport.mesa.blocks.helper.ts` | **47** `mesa_table` blocks |

### Backend API — invite edge (**41**)

| File | Role |
|---|---|
| `backend/src/api/mesa/mesa.route.ts` | Hono mount |
| `backend/src/api/mesa/mesa.controller.ts` | Wiring |
| `backend/src/api/mesa/_handlers/post.mesa.invite.accept.handler.ts` | Invitee accept (routes to owner DO) |
| `backend/src/api/mesa/_handlers/get.mesa.invite.pending.handler.ts` | Pending invites for user |
| `backend/src/api/mesa/_handlers/post.mesa.contribution.handler.ts` | Contributor submit |
| `backend/src/api/mesa/_handlers/get.mesa.audience.handler.ts` | Active audience read |
| `backend/src/api/mesa/index.ts` | Module export |

Register in backend app router (**01**).

### Mobile (**41**)

| File | Role |
|---|---|
| `mobile/features/mesa/components/mesa.compatibility.row.tsx` | Scan/menu/recipe verdict strip |
| `mobile/features/mesa/components/mesa.audience.chip.tsx` | Active audience indicator |
| `mobile/features/mesa/components/mesa.member.list.sheet.tsx` | Conversational setup companion |
| `mobile/features/mesa/components/mesa.invite.review.sheet.tsx` | Contribution queue |
| `mobile/features/mesa/hooks/use.food.audience.hook.ts` | Active audience fetch |
| `mobile/features/mesa/hooks/use.mesa.entitlement.hook.ts` | Tier gate UI |
| `mobile/network/mesa/mesa.api.ts` | Invite + audience endpoints |

### Tests (**41**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/mesa/evaluate.mesa.compatibility.test.ts` | Verdict aggregation |
| `backend/src/agents/brain/_helpers/mesa/merge.constraints.for.audience.test.ts` | Layer merge |
| `backend/src/agents/brain/_helpers/mesa/check.mesa.entitlement.test.ts` | Tier + member cap |
| `backend/src/api/mesa/mesa.contribution.test.ts` | Contributor RPC auth |

---

## Acceptance criteria

### Data model + migrations

- [ ] All seven Mesa tables exist only in owner's Brain DO — never Supabase.
- [ ] `mesa.owner_user_id` matches Brain DO user id.
- [ ] `mesa_constraint.confirmed_by_owner = 1` required before hard constraint used in filtering.
- [ ] Indexes per `01-mesa-data-model.md` shipped.
- [ ] Personal `constraints` table untouched by Mesa member CRUD.

### Food Audience

- [ ] `set_food_audience` persists row with `member_ids_json` valid array.
- [ ] Audience expiry honored — expired rows ignored by `loadActiveFoodAudience`.
- [ ] `just_me` uses personal constraints only.
- [ ] `mesa` expands to all active members.
- [ ] `guest_session` composes **35** guest constraints without mutating personal profile.

### Compatibility engine

- [ ] Per-member red/yellow/green — never averaged away.
- [ ] `works_for_all` only when every selected member green.
- [ ] Protected child/elder hard red → `avoid_for_mesa` when multiple conflicts.
- [ ] Low-confidence product/menu → no false green for hard constraints.
- [ ] Substitution suggests one swap; recipe variant requires explicit accept.

### Conversational setup + tools

- [ ] All Mesa mutations go through `tools/mesa/*` — no direct SQL from LLM.
- [ ] Hard constraint creation blocked until owner confirmation in tool input.
- [ ] `propose_potential_member` cannot create `mesa_member` active row.
- [ ] Potential prompt respects 14-day cap and 30-day dismiss suppression.

### Invites + contributions (phase 2 — still in build manifest)

- [ ] `create_mesa_invite` stores scopes_json; contributor cannot read full Mesa state by default.
- [ ] Contributor submission lands in **owner** DO `mesa_contribution_event`.
- [ ] Invited adult hard constraint suggestion queues — not auto-active.
- [ ] Revoke stops future writes; audit log retained.
- [ ] Accepted `pantry_item` enrichment visible to **34** Mesa meal-plan path — no duplicate inventory fork.

### Entitlement (**43**)

- [ ] Below-tier users cannot set `mesa` audience or create Mesa.
- [ ] +$8/mo add-on OR Viva includes Mesa per `02-tier-entitlements.md`.
- [ ] Max 8 active members; archived excluded; invite accounts don't increase cap.

### Integration hooks

- [ ] **24** scan surfaces Mesa row after personal safety verdict.
- [ ] **34** meal plan accepts `FoodAudience` input when entitled.
- [ ] **42** Bela order reads active audience for shopper warnings.
- [ ] **35** guest archive feeds potential-member inference — no auto Mesa member.
- [ ] **46** practitioner APIs reject Mesa member reads without future scope.
- [ ] **51** share scrub blocks raw member names from Mesa cards.

### Privacy + deletion

- [ ] No Mesa medical data to Ground/map/public tables.
- [ ] Mesa export category labels owner vs contributor data.
- [ ] Child members cannot invoke invite/contribute/purchase tools.

### Tests

- [ ] Compatibility aggregation cases (all green, mixed, avoid).
- [ ] Audience merge with guest + selected members.
- [ ] Entitlement + 8-member cap boundary.

---

## Build order dependencies

1. **04-brain-foundation** — Drizzle migrations for Mesa tables in owner DO.
2. **07-brain-constraint-tools** — personal constraint read pattern for `just_me`.
3. **19-brain-tool-registry** — register `tools/mesa/*`.
4. **24-scanner** — first Mesa surface (compatibility row).
5. **34-pantry-meal-plan** — Mesa meal-plan input + shared enrichment read (can stub **34**).
6. **35-ambient-intelligence** — `guest_session` for audience compose + potential signals.
7. **23-medical-conditions** — medical_watchlist constraint type alignment.
8. **43-pricing-tiers** — Mesa entitlement.
9. **21-platform-notifications** — invite delivery notifications.
10. **03-platform-auth-onboarding** — invitee account identity for cross-user flows.

**Soft depends:** **26-menu-scanning**, **29-cooking-session**, **42-bela**, **47-passport**, **51-viral-sharing**, **52-generative-grammar**, **45-in-store-copilot**, **54-tonight**.

**Blocks:** Full multi-person scan/plan/menu/Bela UX across consumers listed above.

---

## Draft count

**23** files in `draft/` — 22 gap/intended snapshots + `gap-index.md`.
