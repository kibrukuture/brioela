# Viral Sharing — Spec

Feature **51**. Discovery Card system: privacy-scrubbed, static-image share artifacts generated from real Brioela intelligence moments — scan surprises, Mesa compatibility, Kids learning, menu reality, recipe preservation, creator attribution, cook-together, savings, Ground finds, and explicitly consented personal-response lines. Product rule: **share the discovery, not the app.**

**Not in this feature:** Feature logic that *produces* moments (scanner verdict assembly **24**, Kids explanation **44**, Mesa compatibility **41**, menu parsing **26**, heritage capture **13**/**49**, Encore reconstruction **48**, receipt spend math **33**, Ground find auth gate **27**, CGM meal windows **36**, Harvest annual composition **53**, recipe share-sheet import classifier **25**, Passport instruction artifacts **47**, generative grammar renderer implementation (**52** — owns Artifact Layer composition contract); guard/lexicon/reading-gate tooling.

**Living catalog note:** `DiscoveryCardType` union in build-guide **24** is the baseline; extension types `encore_first_cook`, `weekly_summary`, `harvest_chapter`, `harvest_cover` are documented in product specs **44**, **16**, **49** and must be added to the shared constant before implementation (**G2**). Code namespace: `viral.sharing` / `discovery.card`.

---

## Purpose

Brioela grows without paid acquisition when users share useful food discoveries in real life — aisle scans, preserved family recipes, table-compatible dinners. **51** is the consumer/trigger *rendering and consent layer*: it receives `BrioelaMoment` events from product features, scores whether a share prompt is warranted, runs mandatory privacy scrub, shows preview, renders a static image (Artifact Layer via **52**), opens the system share sheet, and records attribution metrics. It never auto-shares, never push-notifies for sharing, and never runs referral programs.

```text
Product feature emits BrioelaMoment → score + suppress → privacy scrub → preview + consent → static card → user share sheet
```

Without **51**, product features would each invent incompatible share UIs and leak allergies, child identity, Mesa member names, or glucose data.

---

## Product definition

| Term | Meaning |
|---|---|
| **Discovery Card** | Static image artifact: one finding, one context line max, tasteful Brioela attribution — looks like information, not an ad |
| **Brioela Moment** | Typed product event eligible for share consideration (`momentId`, `kind`, `sourceFeature`, `suggestedCardType`, `sensitivity`) |
| **Privacy scrub** | Mandatory filter before any card payload is shown or rendered — no card from raw profile state |
| **Share consent level** | `none` \| `preview_confirmed` \| `explicit_sensitive_opt_in` |
| **Moment score** | `surprise`, `usefulness`, `emotionalWeight`, `privacyRisk`, `confidence` → `finalScore` — prompt only above threshold |
| **Suppression** | Per-user dismissal memory — sparse prompts, no repeat nagging |
| **Attribution** | Quiet CTA lines ("Scanned with Brioela") + tagged deep-link/install path for metrics |
| **Acquisition loop (share sheet)** | iOS/Android share extension for recipe import (**25**) — distribution mechanism, not a Discovery Card type |

**Design principles (non-negotiable):**

- Share the discovery, not the app — card content creates curiosity; no "Download now" / referral codes.
- No share card from raw product/profile state — scrub always runs first.
- No auto-share, no auto-open share sheet before preview.
- Blocked sensitivity → no card; `needs_user_review` → preview with redactions.
- Personal glucose/wearable cards: **blocked by default**; `explicit_sensitive_opt_in` only.
- Business-facing copy: personal and factual — no public accusation from one uncertain scan/menu event.
- Child identity, medical conditions, exact location, private Mesa names, practitioner data: **never by default**.

---

## Complete card type inventory

> **Living snapshot (2026-06-12 audit).** Sources: `build-guide/24-viral-sharing/`, cross-feature specs **24**–**53**, `brioela-specs/25-viral-growth-and-sharing.md`.

### Baseline `DiscoveryCardType` (build-guide `02-discovery-card-system.md`)

| # | `cardType` | Trigger (emitter) | Example finding | CTA / attribution | Privacy notes |
|---|---|---|---|---|---|
| 1 | `scan_discovery` | **24** surprising product scan (additive, origin, community signal on product) | "Found: 4 sugar cubes in one serving." | "Scanned with Brioela" | No allergy dump; community note text scrubbed to aggregate framing |
| 2 | `swap` | **24** healthier alternative suggestion | "Instead of this… Brioela suggested this." | "Found with Brioela" | Mesa/allergy reasons scrubbed to safe wording |
| 3 | `kids_learning` | **44** Kids Mode explanation complete | "We scanned this cereal together. My kid learned…" | "we scanned this together with Brioela" | No child name/face; safe allergy rewrite only |
| 4 | `mesa_compatibility` | **41** Mesa finds meal/product for Food Audience | "Dinner that works for everyone at our table." | "Found with Mesa" | No member names; compatibility outcome only |
| 5 | `menu_reality` | **26** menu scan meaningful fit result | "I scanned this menu. Only 3 dishes fit my food profile." | "Scanned with Brioela" | No "restaurant is unsafe" accusations |
| 6 | `recipe_preservation` | **13** generational capture / **49** heritage finalize (not Heirloom send) | "Preserved my grandmother's lentil soup with Brioela." | "Saved to Brioela" | Emotional; no private family health detail |
| 7 | `creator_recipe` | **25** import + **46** verified_profile cook | "Cooked from [Creator] with Brioela." | "Cooked with Brioela" | Adaptation details only with consent; no user health profile |
| 8 | `cook_together` | **29** multi-person cooking room session end | "We cooked together" card to both participants | "Cooked with Brioela" | No private session health context |
| 9 | `savings` | **33** receipt/price intelligence meaningful saving | "Saved $18 this week on groceries." | "Found with Brioela" | No full receipt, store path, or account names |
| 10 | `ground_find` | **27** public Find approved by Ground gate | "Fresh fenugreek spotted nearby today." | "Found with Brioela Ground" | Only finds that passed **27** authenticity/privacy gate; EXIF stripped |
| 11 | `personal_response` | **36** wearable/CGM insight (opt-in) | "I learned this snack spikes me more than I expected." | "Scanned with Brioela" | **Blocked default**; no raw glucose values; no medical claims |

### Extension card types (spec cross-refs — add to shared enum **G2**)

| # | `cardType` | Trigger (emitter) | Example | Owner split |
|---|---|---|---|---|
| 12 | `encore_first_cook` | **48** first completed home cook after Encore reconstruction | Plate photo beside home result; "tasted in [city], cooked at home with Brioela" | **48** trigger UI; **51** scrub/render |
| 13 | `weekly_summary` | **34** weekly food summary generation (`shareable_moment` field) | "I ate well 5 out of 7 days this week. Brioela tracked it for me." | **34** generates line; **51** card render |
| 14 | `harvest_chapter` | **53** Harvest edition per chapter (pre-render at compose time) | Chapter headline + "my Harvest — Brioela" | **53** composition + salience; **51** Artifact Layer render + share transport |
| 15 | `harvest_cover` | **53** Harvest edition cover | Whole-year summary cover card | Same split as `harvest_chapter` |

### Spec 25 moments without dedicated build-guide `04` card section

| Moment | Likely `cardType` mapping | Emitter | Notes |
|---|---|---|---|
| Community notes discovery | `scan_discovery` (variant) or future `community_signal` | **24** scan + hyperlocal signal | Spec 25 ranks medium viral potential; use aggregate nearby framing after scrub |
| Healthy food map share | `ground_find` or map-specific variant | **28** map place surfacing | Location-specific utility; no exact home coordinates |
| Recipe from TikTok (acquisition) | N/A — share-sheet import | **25** | Install loop, not a Discovery Card; may later produce `creator_recipe` after cook |

### Never shareable (taxonomy `01-shareable-moment-taxonomy.md`)

- Normal green scan with nothing interesting
- Fear-only allergy warning by default
- Medical condition details
- Child identity
- Private Mesa member names
- Practitioner/client relationships
- Raw wearable or glucose data
- Exact home location
- Shame-based eating patterns
- Negative business targeting from one low-confidence signal

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** `rg 'discovery.?card|BrioelaMoment|privacyScrub|viral.sharing' backend/src shared/ mobile/` — **zero product matches**.

| # | Component | Type | In **51**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **`DiscoveryCardType` constant** | Shared constant | **Yes** | No | All card pipelines | `02-discovery-card-system.md` |
| 2 | **`BrioelaMoment` schema** | Shared Zod | **Yes** | No | Feature emitters | `01-shareable-moment-taxonomy.md` |
| 3 | **`DiscoveryCard` schema** | Shared Zod | **Yes** | No | Post-scrub render input | `02-discovery-card-system.md` |
| 4 | **`PrivacyScrubResult` schema** | Shared Zod | **Yes** | No | Scrub pipeline output | `03-privacy-scrub-and-consent.md` |
| 5 | **`ShareConsentLevel` constant** | Shared constant | **Yes** | No | Preview gates | `03-privacy-scrub-and-consent.md` |
| 6 | **`ShareMomentScore` helper** | Pure fn | **Yes** | No | Offer decision | `01-shareable-moment-taxonomy.md` |
| 7 | **Privacy scrub policy** | `_policies/` | **Yes** | No | Every card type | `03-privacy-scrub-and-consent.md` |
| 8 | **`scrubDiscoveryCardPayload` helper** | Brain helper | **Yes** | No | Redact + safe rewrites | `03` |
| 9 | **`discovery_card_offer` table** | Brain SQLite | **Yes** | No | Offer/preview/share audit | `06-growth-metrics-and-suppression.md` |
| 10 | **`emitBrioelaMoment` handler** | Brain RPC | **Yes** | No | Feature → moment queue | `02` generation flow |
| 11 | **`requestDiscoveryCard` API** | Backend | **Yes** | No | Mobile preview flow | `02` |
| 12 | **`confirmDiscoveryCardShare` handler** | Brain | **Yes** | No | After preview consent | `03` |
| 13 | **Static card renderer** | Brain + mobile | **Yes** | No | PNG/WebP artifact | `02`, **52** Artifact Layer |
| 14 | **`buildDiscoveryCardGrammarDocument` helper** | **52** consumer | **Cross** | No | Layout source JSON | `27-generative-grammar/06` |
| 15 | **Discovery Card preview sheet** | Mobile | **Yes** | No | User review before share | `02` |
| 16 | **System share sheet bridge** | Mobile | **Yes** | No | Explicit user tap only | `02` |
| 17 | **Deep link + install attribution** | Edge + Supabase | **Yes** | No | Tagged acquisition paths | `05-creator-and-attribution-loop.md`, Harvest `04` |
| 18 | **Suppression state** | Brain SQLite | **Yes** | No | Dismissal memory | `06-growth-metrics-and-suppression.md` |
| 19 | **`shouldSuppressSharePrompt` helper** | Pure fn | **Yes** | No | 2 dismissals/week rule | `06` |
| 20 | **Creator attribution firewall** | Policy | **Cross** | No | **46** verified_profile only | `05-creator-and-attribution-loop.md` |
| 21 | **Metrics events** | Analytics | **Yes** | No | Offer/preview/share/install | `06` |
| 22 | **Per-feature trigger stubs** | Cross-feature | **Cross** | No | See card inventory | **24**, **44**, **48**, etc. |
| 23 | **Share sheet recipe extension** | **25** + **03** | **Cross** | No | Acquisition — not **51** card body | spec **25**, `19-recipe-ingestion/01` |
| 24 | **Viral sharing tests** | Tests | **Yes** | No | Scrub leaks, suppression | — |

### Shipped in repo today (viral-sharing-related)

- `build-guide/24-viral-sharing/` — **7 files complete** (docs only).
- `brioela-specs/25-viral-growth-and-sharing.md` — primary product spec.
- `_records/connections/21-viral-sharing-connections.md`, `_records/build-order/23-layer-viral-sharing.md`, `_records/session-log/028-viral-sharing-complete.md`.
- `mobile/features/viral.sharing/` — **folder named in monorepo structure only**; no files.
- Cross-feature drafts: `48-encore/draft/encore.discovery.card.trigger.gap.md`, `44-kids-mode/draft/kids.share.card.*.gap.md`.
- **Zero** `discovery.card`, `BrioelaMoment`, or `privacyScrub` production code in `backend/`, `shared/`, `mobile/`.

---

## Generation flow

```text
1. Source feature completes primary task (scan verdict, kids explanation, first cook, …)
2. Feature calls emitBrioelaMoment({ … rawPayload, suggestedCardType, sensitivity hint })
3. scoreShareMoment → below threshold → stop (no UI)
4. shouldSuppressSharePrompt → suppressed → stop
5. scrubDiscoveryCardPayload → blocked → stop; needs_user_review → redacted preview
6. Mobile shows DiscoveryCardPreviewSheet — user dismisses or continues
7. confirmDiscoveryCardShare (preview_confirmed or explicit_sensitive_opt_in)
8. buildDiscoveryCardGrammarDocument (**52**) → renderDiscoveryCardStatic → image artifact
9. User taps Share → system share sheet (never auto-opened at step 6)
10. Record attribution + metrics; optional deep link tag on shared URL metadata
```

**Hard rules:**

- Do not prompt before primary task is complete.
- Do not prompt after every scan.
- Do not push-notify to ask users to share.
- Financial referral programs, forced share to unlock, streaks for sharing: **blocked** (`06-growth-metrics-and-suppression.md`).

---

## Privacy scrub (critical)

Every card type passes the same scrub pipeline (`03-privacy-scrub-and-consent.md`).

**Blocked by default fields:** allergies, medical conditions, child identity, exact location, private Mesa member names, practitioner/client data, wearable/glucose raw values, private notes, raw receipts, account/user names unless explicitly chosen.

**Safe rewrite examples (spec text, not invented numbers):**

| Blocked | Allowed rewrite (with consent where noted) |
|---|---|
| "My child is allergic to peanuts." | "We learned this food is not for our family because it contains an ingredient we avoid for safety." |
| "This is bad for my diabetes." | "I learned this food does not fit my personal food profile." (explicit opt-in) |
| "Bad for Sarah and Grandma." | "This dinner works for everyone at our table." |
| Raw glucose spike values | "I learned this snack spikes me more than I expected." (explicit opt-in only) |

**Business safety:** personal factual menu fit OK; "This restaurant is unsafe" blocked unless verified recall/public health issue.

---

## Neighbor boundaries

### vs **47** Passport

| | **51** Discovery Card | **47** Passport |
|---|---|---|
| Purpose | Organic share of a discovery | Temporary instruction for a third party |
| Audience | Social / optional virality | Waiter, shopper, caregiver, school |
| Content | Celebratory finding | Food rules to respect |
| Pipeline | Moment → scrub → static share image | Kind → minimize → instruction blocks → QR/link |
| Optimization | Curiosity, not ads | Scannable handoff, expires/revokes |

Passport explicitly **not** a Discovery Card (`brioela-specs/43-passport.md`). Do not reuse Passport render for viral cards.

### vs **49** Heirloom

| | **51** Recipe Preservation Card | **49** Heirloom send |
|---|---|---|
| Trigger | Generational **capture** moment | Owner **assembles + invites** family |
| Delivery | Public-safe scrubbed image | Private DO-to-DO copy |
| Content | One emotional headline | Full bundle (recipes, style, moments) |
| Tier | Share prompt only | Culina `heirloom_send` for assembly |

Heirloom inheritance loop is acquisition channel (`35-heirloom/00-overview.md`) — not a share card type.

### vs **52** Generative Grammar

| **52** owns | **51** owns |
|---|---|
| `BrioelaGenerativeUiDocument` schema + renderer | When to offer share; scrub; consent |
| Artifact Layer composition primitives | Card type payloads + CTA rules |
| `discovery_card_render` surface contract | Preview sheet + share sheet bridge |
| Grammar failure fallback patterns | Suppression + metrics |

Discovery Cards may use grammar as **layout source**; **final share output is always static image after scrub** (`27-generative-grammar/06-surface-integration.md`). **52** `status.md` lists **51** as blocker.

### vs **53** Harvest

| **53** owns | **51** owns |
|---|---|
| Annual gather/compose/salience/chapter copy | `harvest_chapter` / `harvest_cover` render + share transport |
| `harvest_edition` / `harvest_chapter` tables + R2 refs | Privacy scrub for share surface (categories excluded at compose) |
| Pre-render timing at composition step 6 | Attribution tagging (`04-share-cards.md`) |
| EXIF strip policy ( cites **35** Ground media rule) | System share sheet invocation |

Harvest is highest-volume share surface (spec **25**); edition composition is **53**, card artifact pipeline is **51**.

### vs product emitters (**24**, **44**, **48**, …)

Product features **emit moments and show trigger UI** (e.g. Encore `encore.discovery.card.trigger`, Kids share button). **51** owns scrub, preview, render, attribution, suppression. Never duplicate scrub logic in emitters.

---

## Share sheet acquisition (not a card type)

Spec **25** + `19-recipe-ingestion/07-import-status-and-growth-loop.md`:

1. User shares TikTok/YouTube/Instagram URL → Brioela share extension (**25**).
2. Recipe imports privately; install handoff if app missing.
3. Future `creator_recipe` Discovery Card may follow cook — separate from import loop.

**51** may record install attribution tags on Discovery Card deep links; share-extension registration lives in **03** platform foundation + **25**.

---

## Success metrics (`06-growth-metrics-and-suppression.md`)

Track: Discovery Card offer rate, preview rate, share completion rate, downstream install/open rate, share-sheet import conversion, card-type performance, scan-to-share rate, imported recipe later cooked, creator attribution engagement, Mesa card engagement when **41** ships.

**Do not optimize for raw share volume alone** — fewer high-quality cards beats noisy prompts.

Quality review periodically: privacy leaks, fear copy, medical overclaims, business targeting, child identity leakage, promotional feel. Disable card types that repeatedly fail review.

---

## Dependencies

| Layer | Feature | Why |
|---|---|---|
| Design tokens + card templates | **02** | Visual templates for static render |
| Share extension shell | **03** + **25** | Acquisition loop |
| Feature moment emitters | **24**, **26**, **29**, **33**, **34**, **41**, **44**, **46**, **48**, **27**, **36**, **53** | Triggers |
| Grammar Artifact Layer | **52** | Optional layout composition |
| Verified creator attribution | **46** | `creator_recipe` firewall |
| Tier gates | **43** | Some triggers gated upstream (Kids **44**, Cook Together spec **19** Culina) |

---

## Obsolete sources / conflicts

| Source | Issue | Resolution |
|---|---|---|
| `brioela-specs/03-hyperlocal-community-notes.md` | Deprecated → Ground **35** | Community signal on scan cards uses Ground/Find framing, not legacy `community_note` API |
| `DiscoveryCardType` vs extension types | Encore/Harvest/weekly not in build-guide `02` enum | Add extensions in shared constant (**G2**) |
| Layer ledger `23-layer-viral-sharing.md` | Omits **52**, **53**, **48** card types | Ledger is build-order snapshot only; this spec is authoritative |
| `52-generative-grammar/status.md` | Lists **51** as blocker | Correct — grammar Artifact Layer follows card contracts |
| Spec **25** "community notes" + "healthy food map" | No `04-feature-specific` section | Map to `scan_discovery` / `ground_find` until dedicated types justified |

---

## Sources

- `brioela-specs/25-viral-growth-and-sharing.md`
- `build-guide/24-viral-sharing/` (all 7 files)
- `_records/connections/21-viral-sharing-connections.md`
- `_records/build-order/23-layer-viral-sharing.md`
- `_records/session-log/028-viral-sharing-complete.md`
- Cross-feature: `build-guide/07-scanner/04-scan-result-ui.md`, `21-kids-mode/04-share-card.md`, `31-encore/05-share-and-records.md`, `36-harvest/04-share-cards.md`, `27-generative-grammar/06-surface-integration.md`, neighbor `_features/44`, `47`, `48`, `49`, `52`, `53`
