# Passport — Build

Feature **47**. Production paths under `backend/src/agents/brain/_schemas/passport.*.ts`, `backend/src/agents/brain/_handlers/passport/`, `backend/src/agents/brain/_helpers/passport/`, `backend/src/agents/brain/tools/passport/`, `shared/validator/passport/`, `shared/constants/passport/`, `shared/routes/passport.routes.ts`, `shared/contracts/passport.contract.ts`, `backend/src/api/passport/` (including public QR link handler), and `mobile/features/passport/`. All Passport authoritative state in user's Brain DO SQLite.

**Scope:** `passport` / `passport_instruction_block` / `passport_audit_event` tables, Zod validators, kind-specific block builders, privacy minimization + medical boundary helpers, translation helper, expiration/revocation, Brain tools, preview/confirm flow, static + grammar-wrapped render paths, image/PDF artifact generation, QR link edge route, mobile preview sheet and full-screen display, integration hooks from menu/Bela/Mesa/travel/practitioner entry points. **Not in 47 build:** Mesa tables (**41**), menu scan pipeline (**26**), Bela order FSM (**42**), travel preload (**35**), Encore reconstruction (**48**), Discovery Card scrub/generation (**51**), grammar engine body (**52**), practitioner relationship DDL (**46**), tier matrix (**43** — no Passport action in spec), full "what Brioela knows" settings inventory (spec **34** — see **G35**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/28-passport/` (8 files) | ✓ docs only |
| `brioela-specs/43-passport.md` | ✓ spec |
| `_records/connections/25-passport-connections.md` | ✓ ledger |
| `_records/build-order/26-layer-passport.md` | ✓ ledger |
| `_records/session-log/035-passport-complete.md` | ✓ session log |
| Passport Brain tables / tools / handlers | ✗ |
| `shared/validator/passport/` | ✗ |
| `backend/src/api/passport/` | ✗ |
| `mobile/features/passport/` | ✗ |
| `passport.contract.ts` | ✗ |
| Passport tests | ✗ |

**Zero Passport production code.** `rg 'passport|Passport' backend/src shared/ mobile/` — no product matches (KYC unrelated string excluded).

---

## File manifest

### Shared constants + validator (**47**)

| File | Role |
|---|---|
| `shared/constants/passport/passport.kind.constant.ts` | `PassportKind` union |
| `shared/constants/passport/passport.share.mode.constant.ts` | `PassportShareMode` |
| `shared/constants/passport/passport.consent.level.constant.ts` | `PassportConsentLevel` |
| `shared/constants/passport/passport.severity.constant.ts` | Block severity enum |
| `shared/constants/passport/index.ts` | Barrel |
| `shared/validator/passport/passport.instruction.block.schema.ts` | Block shape |
| `shared/validator/passport/passport.schema.ts` | Full Passport + create payload |
| `shared/validator/passport/passport.preview.schema.ts` | Preview response |
| `shared/validator/passport/index.ts` | Barrel |
| `shared/routes/passport.routes.ts` | `PASSPORT_ROUTES` |
| `shared/contracts/passport.contract.ts` | ts-rest `passport.create`, `passport.revoke`, `passport.get` |

### Brain SQLite schemas (**47**)

| File | Role |
|---|---|
| `_schemas/passport.schema.ts` | `passport` header row |
| `_schemas/passport.instruction.block.schema.ts` | `passport_instruction_block` |
| `_schemas/passport.audit.event.schema.ts` | `passport_audit_event` |
| `_schemas/passport.link.token.schema.ts` | Optional link token metadata (if not inline on `passport`) |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add Passport tables to Brain chain |

### Brain helpers — generation + privacy (**47**)

| File | Role |
|---|---|
| `_helpers/passport/build.passport.blocks.helper.ts` | Orchestrator: kind → builder |
| `_helpers/passport/build.personal.food.safety.blocks.helper.ts` | `personal_food_safety` |
| `_helpers/passport/build.passport.mesa.blocks.helper.ts` | `mesa_table` — **41** audience |
| `_helpers/passport/build.passport.menu.blocks.helper.ts` | `restaurant_menu` — **26** |
| `_helpers/passport/build.passport.bela.blocks.helper.ts` | `bela_shopper` — **42** |
| `_helpers/passport/build.passport.caregiver.blocks.helper.ts` | `caregiver_school` — **44** scrub |
| `_helpers/passport/build.passport.travel.blocks.helper.ts` | `travel_translation` — **35** locale hints |
| `_helpers/passport/build.passport.practitioner.blocks.helper.ts` | `practitioner_guidance` — **46** |
| `_helpers/passport/minimize.passport.privacy.helper.ts` | Default redactions + safe rewrites |
| `_helpers/passport/check.passport.medical.boundary.helper.ts` | Block clinical language |
| `_helpers/passport/compute.passport.expiration.helper.ts` | Per-kind defaults |
| `_helpers/passport/translate.passport.blocks.helper.ts` | Meaning-preserving translation |
| `_helpers/passport/render.passport.static.helper.ts` | Static layout nodes for mobile/server |
| `_helpers/passport/index.ts` | Barrel |

### Brain handlers (**47**)

| File | Role |
|---|---|
| `_handlers/passport/preview.passport.handler.ts` | Build draft blocks without persist |
| `_handlers/passport/create.passport.handler.ts` | Persist after `preview_confirmed` |
| `_handlers/passport/revoke.passport.handler.ts` | Revoke + invalidate link |
| `_handlers/passport/get.passport.handler.ts` | Owner read active/history |
| `_handlers/passport/list.passports.handler.ts` | Active + recent expired |
| `_handlers/passport/record.passport.audit.handler.ts` | viewed/shared events |
| `_handlers/passport/render.passport.artifact.handler.ts` | Image/PDF bytes post-validation |
| `_handlers/passport/index.ts` | Barrel |

### Brain tools — `tools/passport/` (**47**)

| File | Role |
|---|---|
| `tools/passport/create.passport.tool.ts` | Agent path after user confirm |
| `tools/passport/revoke.passport.tool.ts` | `revoke_passport` |
| `tools/passport/index.ts` | Barrel → **19** registry |

### Backend API (**47**)

| File | Role |
|---|---|
| `backend/src/api/passport/passport.route.ts` | Hono mount `/api/passport` |
| `backend/src/api/passport/passport.controller.ts` | Wiring |
| `backend/src/api/passport/_handlers/post.passport.preview.handler.ts` | Preview RPC |
| `backend/src/api/passport/_handlers/post.passport.create.handler.ts` | Confirm + persist |
| `backend/src/api/passport/_handlers/post.passport.revoke.handler.ts` | Revoke |
| `backend/src/api/passport/_handlers/get.passport.handler.ts` | Owner fetch |
| `backend/src/api/passport/_handlers/get.passport.link.handler.ts` | **Public** token route — content only |
| `backend/src/api/passport/index.ts` | Module export |

Register in backend app router (**01**).

### Mobile (**47**)

| File | Role |
|---|---|
| `mobile/features/passport/components/passport.preview.sheet.tsx` | Edit lines, share mode, translate |
| `mobile/features/passport/components/passport.display.screen.tsx` | Full-screen show-on-screen mode |
| `mobile/features/passport/components/passport.expiration.badge.tsx` | Expiry + revoke status |
| `mobile/features/passport/components/passport.severity.section.tsx` | Block layout |
| `mobile/features/passport/hooks/use.passport.preview.hook.ts` | Preview mutation |
| `mobile/features/passport/hooks/use.passport.share.hook.ts` | Image/PDF/text/QR actions |
| `mobile/network/passport/passport.api.ts` | API client |

### Integration entry surfaces (consumers call **47** preview)

| Surface | Owner | Entry |
|---|---|---|
| Menu scan result | **26** | "Create Passport for staff" CTA |
| Mesa active audience chip | **41** | "Table Passport" action |
| Bela order review | **42** | "Shopper rules" handoff |
| Travel ready / map context | **35** + user action | "Translated Passport" |
| Caregiver flow | **44** parent | School/snack Passport |
| Practitioner client view | **46** | Include approved note in Passport |

### Tests (**47**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/passport/minimize.passport.privacy.helper.test.ts` | Redaction cases |
| `backend/src/agents/brain/_helpers/passport/check.passport.medical.boundary.helper.test.ts` | Blocked phrases |
| `backend/src/agents/brain/_handlers/passport/create.passport.handler.test.ts` | Expiry + consent |
| `backend/src/api/passport/get.passport.link.handler.test.ts` | Expired/revoked token → 404 |

---

## Acceptance criteria

### Data + API

- [ ] `passport`, `passport_instruction_block`, `passport_audit_event` tables migrate in Brain DO (**04**).
- [ ] `POST` preview returns blocks without persist; `POST` create requires `preview_confirmed` consent.
- [ ] Every Passport has `expires_at`; expired Passports reject link serve and show expired state in app.
- [ ] Revoke sets `status=revoked`, `revoked_at`, invalidates QR token immediately.
- [ ] Public link route returns instruction content only — no user id, dashboard, or brain state.

### Generation + privacy

- [ ] No automatic Passport creation without user confirmation.
- [ ] Default redactions: child names, Mesa member names, condition names when food-rule wording suffices, wearable data, scan history, home location.
- [ ] `sensitivity=blocked` prevents share; user sees why.
- [ ] Medical boundary blocks diagnosis, treatment, dosing, emergency protocol language.
- [ ] `mesa_table` uses generic member labels unless `include_sensitive_detail`.

### Kinds

- [ ] All seven `PassportKind` values have block builders wired through orchestrator.
- [ ] `restaurant_menu` pulls waiter questions + avoid lines from active menu scan context (**26**).
- [ ] `bela_shopper` reflects active order constraints (**42**).
- [ ] `travel_translation` uses destination language from active travel context when present (**35**).
- [ ] `practitioner_guidance` includes only user-approved active annotations (**46**).

### Display + share

- [ ] Share modes: show_on_screen, image, pdf, qr_link, text — all functional after confirm.
- [ ] Static renderer works when grammar surface unavailable (**52** fallback).
- [ ] Image/PDF artifacts contain no hidden EXIF/metadata with private profile fields.
- [ ] Translation preserves food-safety meaning; dual-language display when configured.
- [ ] Travel Passport readable offline after generation (local snapshot).

### Integration

- [ ] Menu scan surfaces suggest Passport; user must confirm (**26** hook).
- [ ] Bela order flow offers shopper Passport (**42** hook).
- [ ] Mesa table Passport reads `loadActiveFoodAudience` (**41** hook).
- [ ] Passport is not routed through Discovery Card pipeline (**51**).

### Notifications (resolve **G28**)

- [ ] Product decision recorded: either remove `passport_prompt` from **21** or narrow it to in-app-only milestone (not "make a Passport" push per `03-generation-flow.md`).

### Tier (resolve **G29**)

- [ ] If product adds Passport tier gate, register `FeatureAction` in **43** — until then, no silent gate.

### Tests

- [ ] Privacy minimization golden cases (Mesa generic wording, child name strip).
- [ ] Expiration per kind defaults.
- [ ] Revoked/expired link returns 404.

---

## Build order dependencies

1. **04-brain-foundation** — Drizzle migrations for Passport tables.
2. **07-brain-constraint-tools** — confirmed constraints read path.
3. **19-brain-tool-registry** — register `tools/passport/*`.
4. **23-medical-conditions** — food-rule wording source (can stub).
5. **26-menu-scanning** — `restaurant_menu` source (can stub).
6. **41-mesa** — `mesa_table` audience (can stub `just_me` only initially).
7. **42-bela** — `bela_shopper` source (can stub).
8. **35-ambient-intelligence** — travel language hints (can stub home locale).
9. **46-verified-profiles** — practitioner notes (can stub empty).
10. **52-generative-grammar** — optional presentation layer; static path ships first.
11. **01-platform-foundation** — API module + public link route.

**Soft depends:** **44-kids-mode**, **28-map**, **21-platform-notifications**, **43-pricing-tiers**.

**Blocks:** Real-world handoff UX across menu, Mesa, Bela, travel, caregiver, practitioner flows cited in spec **43**.

---

## Draft count

**27** files in `draft/` — 26 gap/intended snapshots + `gap-index.md`.
