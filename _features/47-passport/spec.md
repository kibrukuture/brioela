# Passport — Spec

Feature **47**. Temporary, privacy-safe food instruction artifacts for real-world handoffs: the user shows or sends only the food rules another human needs right now — waiters, Bela shoppers, caregivers, school staff, hosts, travel contexts, and practitioners. Passport is action infrastructure, not viral sharing. Records live in Brain DO SQLite; QR/link display may use edge routes with unguessable tokens. Generative Grammar may frame presentation; instruction content is validated and static.

**Not in this feature:** Product/menu scan verdict pipelines (**24**, **26** — **47** consumes waiter questions and avoid rules); Mesa tables and compatibility engine (**41** — **47** consumes active Food Audience for `mesa_table` blocks); Bela order state machine (**42** — **47** reads order constraints for `bela_shopper`); medical condition detection and rule config (**23** — **47** minimizes condition names into food-rule wording); travel intent detection, QStash preload jobs, Redis geo cache writes (**35** — **47** `travel_translation` consumes destination language hints only); map rendering and travel-cache display (**28** — reads cache **35** wrote); Encore dish reconstruction (**48** — separate product); Discovery Card generation and share-sheet loops (**51**); generative grammar renderer implementation (**52** — owns `passport_render_brioela_generative_ui` surface contract); practitioner–client relationship and annotation write path (**46** — **47** may include user-approved notes in preview); Kids Mode kid explanations (**44** — **47** applies child-name scrub for `caregiver_school`); tier catalog matrix body (**43** — spec **43** does not define Passport tier gates); guard/lexicon/reading-gate tooling.

**Living catalog note:** `PassportKind`, `PassportShareMode`, and `PassportConsentLevel` enums are stable contracts. New kinds require privacy review. Name is **Passport** — never "Food Passport" or "Mesa Passport" in product copy (Mesa is a *kind*, not a product rename).

---

## Purpose

Food safety fails at the handoff. The user knows their needs; Brioela knows their constraints; the waiter, shopper, caregiver, or host may misunderstand, forget, or lack language to ask the right question.

Passport turns private Brioela intelligence into a minimal, temporary, human-readable instruction card. It answers:

```text
What does this person or table need another human to know right now?
```

Without **47**, menu scans, Mesa tables, Bela orders, travel, and practitioner guidance have no standardized, privacy-scrubbed artifact for third-party humans — only in-app verdicts the recipient never sees.

---

## Product definition

| Term | Meaning |
|---|---|
| **Passport** | Product name for the temporary instruction artifact and the action to create one. Not a profile export, not a share card. |
| **Passport kind** | Use-case discriminator: personal, table, menu, shopper, caregiver, travel, practitioner. |
| **Instruction block** | Validated heading + lines + severity (`info` \| `ask` \| `avoid` \| `critical`). |
| **Food Audience** | Who the rules apply to — reuses `FoodAudience.mode` from **41** (`self` \| `mesa` \| `selected_members` \| `guest_session`). |
| **Share mode** | How the user delivers the artifact: screen, image, PDF, QR link, plain text. |
| **Sensitivity** | `public_safe` \| `limited_sensitive` \| `blocked` — pre-render gate. |
| **Consent level** | `preview_confirmed` (default), `include_sensitive_detail`, `translated_preview_confirmed`. |
| **Expiration** | Every Passport expires; no permanent public links. |
| **Revocation** | User can invalidate any active Passport immediately; QR/link routes stop serving. |

**Design principle (non-negotiable):** Passport is a food boarding pass — action-first, scannable in seconds, useful without explaining Brioela. It is not "about the user"; it is instructions for the person helping them eat safely.

**Explicit non-goals:**

- Not a Discovery Card (**51**).
- Not travel food memory or trip journaling (**35** owns preload intel; **48** owns dish recreation).
- Not a full brain export or "download my data" dump (though neighbor features reference a related privacy inventory — see **G35** in `status.md`).

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/28-passport/`, `brioela-specs/43-passport.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/21`, `23`, `26`, `28`, `35`, `41`, `42`, `44`, `46`, `48`, `51`, `52`.

| # | Component | Type | In **47**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **`passport` table** | Brain SQLite | **Yes** | No | User creates Passport | `02-passport-data-model.md` |
| 2 | **`passport_instruction_block` table** | Brain SQLite | **Yes** | No | Generation pipeline | `02` |
| 3 | **`passport_audit_event` table** | Brain SQLite | **Yes** | No | created/viewed/shared/revoked/expired | `02` |
| 4 | **`PassportKind` enum (7 kinds)** | Shared constant | **Yes** | No | Product contract | `01-passport-types.md`, spec **43** |
| 5 | **`PassportShareMode` enum** | Shared constant | **Yes** | No | Preview actions | `05-translation-and-display.md` |
| 6 | **`PassportConsentLevel` enum** | Shared constant | **Yes** | No | Sensitive/translation gates | `04-privacy-and-consent.md` |
| 7 | **Generation trigger policy** | Policy | **Yes** | No | User action or explicit confirm only | `03-generation-flow.md` |
| 8 | **Source selection + minimization pipeline** | Brain helper chain | **Yes** | No | Recipient → audience → rules → scrub | `03` |
| 9 | **`personal_food_safety` block builder** | Helper | **Yes** | No | Confirmed constraints + conditions | `01` |
| 10 | **`mesa_table` block builder** | Helper | **Yes** | No | Active Food Audience (**41**) | `01`, `06` |
| 11 | **`restaurant_menu` block builder** | Helper | **Yes** | No | Menu scan waiter Q + avoid rules (**26**) | `01`, `06` |
| 12 | **`bela_shopper` block builder** | Helper | **Yes** | No | Bela order constraints (**42**) | `01`, `06` |
| 13 | **`caregiver_school` block builder** | Helper | **Yes** | No | Child rules; no name by default (**44**) | `01`, `06` |
| 14 | **`travel_translation` block builder** | Helper | **Yes** | No | Confirmed rules + destination language (**35** hints) | `01`, `05`, `06` |
| 15 | **`practitioner_guidance` block builder** | Helper | **Yes** | No | User-approved annotations (**46**) | `01`, `06` |
| 16 | **Privacy minimization / redaction** | Helper | **Yes** | No | Default exclusions list | `04-privacy-and-consent.md` |
| 17 | **Medical boundary checker** | Helper | **Yes** | No | Block diagnose/treat/dose/emergency claims | `04` |
| 18 | **Expiration defaults per kind** | Helper | **Yes** | No | Same-day menu/Mesa; order-bound Bela; etc. | `02` |
| 19 | **Revocation + link invalidation** | Handler | **Yes** | No | User revoke; audit preserved | `02`, `04` |
| 20 | **Preview-before-share UI** | Mobile | **Yes** | No | Edit/remove line; pick share mode | `03` |
| 21 | **Translation pass** | Helper + LLM | **Yes** | No | Meaning over literal; dual-language option | `05` |
| 22 | **Static renderer (fallback)** | Mobile + server | **Yes** | No | Grammar failure must not block | `07-rendering-with-grammar.md` |
| 23 | **Generative Grammar surface** | **52** consumer | **Cross** | No | `passport_render_brioela_generative_ui` | `07` |
| 24 | **Image/PDF artifact render** | Handler | **Yes** | No | Post-validation static output; no hidden metadata | `05`, `07` |
| 25 | **QR/link public route** | Edge API | **Yes** | No | Unguessable token; expires; no account state | `04` link privacy |
| 26 | **`create_passport` Brain tool** | Tool | **Yes** | No | Agent-invoked after user confirm | `03` |
| 27 | **`revoke_passport` Brain tool** | Tool | **Yes** | No | Immediate invalidation | `02` |
| 28 | **Menu scan "Create Passport for staff" CTA** | **26** consumer | **Cross** | No | Post-scan suggest + user confirm | `06` |
| 29 | **Bela "shopper rules" handoff** | **42** consumer | **Cross** | No | Order flow entry | `06` |
| 30 | **Offline travel Passport** | Mobile cache | **Yes** | No | Accessible once generated | `06` Travel |
| 31 | **Mesa generic member wording** | Policy | **Yes** | No | "One person at this table…" | `01`, `04` |
| 32 | **Practitioner note inclusion gate** | **46** consumer | **Cross** | No | Active annotation + user preview approve | `06` |
| 33 | **Viral sharing boundary** | Policy | **N/A** | — | Passport ≠ Discovery Card | `06`, spec **43** |
| 34 | **`passport_prompt` notification** | **21** cross-ref | **Conflict** | No | Listed in **21**; blocked in `03-generation-flow` | see **G28** |
| 35 | **Tier gate** | **43** | **Unspecified** | No | Spec **43** has no tier section | **G29** |
| 36 | **"What Brioela knows about me" inventory** | Settings UI | **Ambiguous** | No | Spec **34** defines; neighbors cite **47** | **G35** |
| 37 | **Mesa export category** | Delete/export | **Cross** | No | Explicit Mesa export labels | `26-mesa/09-privacy-permissions.md` |
| 38 | **Health/wearable export opt-in** | Policy | **Cross** | No | Default export excludes health | spec **40**, **36** |
| 39 | **`passport.contract.ts` ts-rest spine** | Shared contract | **Yes** | No | `passport.create` endpoint | `27-generative-grammar/21` |
| 40 | **Passport tests** | Tests | **Yes** | No | Privacy scrub, expiry, medical block | — |

### Shipped in repo today (passport-related)

- `build-guide/28-passport/` — **8 files complete** (docs only).
- `brioela-specs/43-passport.md` — primary spec.
- `_records/connections/25-passport-connections.md`, `_records/build-order/26-layer-passport.md`.
- `_records/session-log/035-passport-complete.md`.
- **`rg 'passport|Passport' backend/src shared/`** — zero product matches.
- **`rg 'passport|Passport' mobile/`** — only unrelated KYC copy in `verification-start.tsx`; `features_to_build.ts` is legacy VoiceBudget stub.

---

## Passport kinds

```typescript
type PassportKind =
  | 'personal_food_safety'
  | 'mesa_table'
  | 'restaurant_menu'
  | 'bela_shopper'
  | 'caregiver_school'
  | 'travel_translation'
  | 'practitioner_guidance'
```

| Kind | Primary recipient | Default expiration | Key sources |
|---|---|---|---|
| `personal_food_safety` | Staff, host, caregiver (one user) | User-selected / same day | **07** constraints, **23** food rules |
| `mesa_table` | Restaurant staff, group host | Same day or meal session | **41** Food Audience |
| `restaurant_menu` | Waiter/kitchen | Same day | **26** scan waiter Q + avoid lines |
| `bela_shopper` | Shopper/substituter | Order completion | **42** order constraints |
| `caregiver_school` | School/caregiver | User-selected duration | **07**, **23**, **44** child scrub |
| `travel_translation` | Local restaurant staff | Trip context or user duration | **07**, **23**, **35** language hints |
| `practitioner_guidance` | Care context handoff | Until revoked or note changes | **46** user-approved annotations |

---

## Data model

**Storage rule:** authoritative Passport rows in user's Brain DO SQLite. QR/link routes read through edge handler with token lookup — never expose dashboard or full brain.

```typescript
type Passport = {
  passportId: string
  userId: string
  kind: PassportKind
  audience: 'self' | 'mesa' | 'selected_members' | 'guest_session'
  title: string
  instructionBlocks: PassportInstructionBlock[]
  language: string
  expiresAt: number
  revokedAt: number | null
  shareMode: 'show_on_screen' | 'image' | 'pdf' | 'qr_link' | 'text'
  sensitivity: 'public_safe' | 'limited_sensitive' | 'blocked'
  createdAt: number
}

type PassportInstructionBlock = {
  heading: string
  lines: string[]
  severity: 'info' | 'ask' | 'avoid' | 'critical'
}
```

Tables: `passport`, `passport_instruction_block`, `passport_audit_event` — see `build-guide/28-passport/02-passport-data-model.md`.

**Not specified in source docs:** whether image/PDF bytes live in R2, are generated ephemerally on share, or are client-only. Treat as open design (**G30**).

---

## Generation flow

1. **Trigger** — user taps Create Passport, voice request, Bela/travel/caregiver entry, or post-menu-scan suggestion **with user confirmation**. Blocked: automatic generation, background sharing, push asking user to make a Passport (`03-generation-flow.md`).
2. **Context** — determine recipient and Food Audience.
3. **Collect** — pull only necessary rules from allowed sources (constraints, conditions, Mesa, guest, menu scan, Bela, travel hints, practitioner notes).
4. **Minimize** — strip identity, condition names where food-rule wording suffices, Mesa member names, wearable data, scan history, home location.
5. **Build blocks** — kind-specific helper; run medical boundary check.
6. **Preview** — user edits/removes lines, picks share mode, optional translation.
7. **Confirm** — record consent level; persist Passport + audit `created`.
8. **Deliver** — render static artifact; optional QR link with unguessable token.

---

## Privacy and consent

**Excluded by default:** child names, Mesa member names, exact medical condition names (when food-rule wording enough), practitioner relationship details, wearable/glucose data, full allergy profile, scan history, exact home location, private notes.

**Consent levels:** `preview_confirmed` (most), `include_sensitive_detail` (explicit), `translated_preview_confirmed` (translation).

**Medical boundary — allowed:** ingredient avoidance, preparation questions, cross-contact warnings, food consistency notes. **Blocked:** diagnosis, treatment, medication dosing, emergency protocols, "medically safe" restaurant/product claims.

**Link privacy:** QR links expire, revocable, unguessable token, Passport content only.

---

## Feature integration

| Neighbor | **47** consumes | **47** does not own |
|---|---|---|
| **26** menu scanning | Yellow waiter questions, red avoid rules | Menu parse pipeline |
| **41** Mesa | Active Food Audience → `mesa_table` blocks | Mesa tables, compatibility engine |
| **42** Bela | Order substitution constraints → `bela_shopper` | Order FSM, shopper session |
| **23** medical conditions | Food-rule minimization | Condition detection, rules DDL |
| **44** kids mode | Child-name scrub on `caregiver_school` | Kid explanations, co-scan UI |
| **35** ambient / travel | Destination language hints for translation | `travel_intent`, preload jobs, Redis cache |
| **28** map | — (no direct Passport read) | Map render, travel cache display |
| **46** verified profiles | User-approved practitioner notes | Practitioner relationship APIs |
| **51** viral sharing | — (explicit boundary) | Discovery Cards, share scrub |
| **52** grammar | Surface contract + static fallback | Grammar engine implementation |
| **21** notifications | — | `passport_prompt` policy conflict (**G28**) |

---

## Boundary clarifications

### **47** vs **48** Encore

| | **47** Passport | **48** Encore |
|---|---|---|
| Input | Private constraints + context | Plate photo (+ optional voice) |
| Output | Temporary instruction card for a third party | Private reconstructed recipe in user's library |
| Sharing | Handoff to waiter/shopper/caregiver — not social | Optional Discovery Card after first **home** cook (**51**) |
| Storage | `passport*` tables, expires | `encore*` tables, long-lived recipe |
| Travel | Translated food-safety instructions | "Tasted in Rome, cooked at home" narrative |

No overlap in tables, APIs, or user intent.

### **47** vs **35** pre-trip intel

| | **35** | **47** `travel_translation` |
|---|---|---|
| Detects travel intent | Yes | No |
| Preloads map/products/menus | Yes | No |
| Writes `travel_local_cache` / Redis | Yes | No |
| User-facing artifact | Banner / quiet notification | User-generated translated instruction card |
| Offline | Cache for scan/map | Passport snapshot once user creates it |

**35** prepares the destination; **47** helps the user communicate needs to a local human. Language hints from **35** preload may inform translation target locale — not a duplicate of preload.

### **47** vs **51** viral sharing

Discovery Cards share what Brioela found (celebratory, scrubbed, optional). Passport communicates what must be respected (instructional, temporary, never optimized for virality). Do not reuse share-card pipeline for Passport render.

### **47** vs **28** map

**28** displays preloaded healthy places on arrival (**35** producer). Passport does not render map data. Travel Passport may reference local labeling context indirectly via **35** hints only.

---

## Success metrics (from spec **43**)

- Passport generation rate after menu scans.
- Passport use in Bela orders.
- Passport translation use while traveling.
- User-reported usefulness after restaurant/caregiver handoffs.
- Reduction in repeated manual waiter-question taps when Passport is used.

---

## Source documents

### Primary

- `brioela-specs/43-passport.md`
- `build-guide/28-passport/00-overview.md` through `07-rendering-with-grammar.md`

### Integration sources

- `build-guide/17-menu-scanning/08-language-bridge.md`
- `build-guide/26-mesa/09-privacy-permissions.md`
- `build-guide/01-design-system/13-evidence-first-ui.md` (Passport boarding-pass UX)
- `build-guide/27-generative-grammar/21-contract-spine-hardening.md`, `22-ts-rest-full-stack-standard.md`
- `brioela-specs/22-pre-trip-food-intelligence.md` (language hints only)
- `brioela-specs/34-universal-visual-intake.md` ("what Brioela knows" — ownership tension)
- `brioela-specs/44-encore.md` (boundary)

### Neighbor feature migrations

- `_features/21-platform-notifications/spec.md` (`passport_prompt`)
- `_features/35-ambient-intelligence/spec.md`
- `_features/41-mesa/spec.md`
- `_features/28-map/spec.md`
- `_features/48-encore/status.md`
- `_features/51-viral-sharing/status.md`

### Ledgers

- `_records/connections/25-passport-connections.md`
- `_records/build-order/26-layer-passport.md`
- `_records/session-log/035-passport-complete.md`
