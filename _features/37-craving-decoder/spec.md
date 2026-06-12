# Craving Decoder — Spec

Feature **37**. User-initiated craving analysis: when the user asks "why am I craving this?" (voice, chat, or scan screen), Brioela assembles evidence from sleep/readiness (**36**), observed eating recency, wellbeing/stress signals (**35**), craving history, optional glucose dynamics (**36**/**50** Kin), and user-volunteered cycle context — names at most two ranked causes with sourced plain language, offers one optional practical next step (pantry bridge **34**, Tonight adjustment **54**, or flattest-alternative note **50**), and writes `craving_decoded` memory events that feed `craving_correlation` patterns in the **35**/**12** weekly pass.

**Not in this feature:** proactive craving commentary or stress-eating surfacing (**35** ambient budget — spec **17** owns unsolicited pattern mentions); nutrient absence detection over multi-week windows (**38** negative-space nutrition); wearables ingest or `health.biometrics` writes (**36**); pantry inventory model DDL or rescue ranking body (**34** — consumer only for bridge offers); Tonight card generation (**54** — consumer for sleep-cause adjustment handoff); Kin cluster aggregation (**50** — consumer for flattest-alternative line); scanner constraint-check orchestration (**24** — craving-context scan hook only); disordered-eating treatment or diagnosis; craving suppression coaching or willpower framing.

**Living catalog note:** Craving categories (sweet, salty, comfort, etc.) are product strings in skill content and event payloads — not SQL enums. New categories are skill/deploy updates, not migrations.

---

## Purpose

The most common food question — "why do I want this right now?" — is the moment where cross-domain evidence (sleep, gaps, stress, history, glucose) is most valuable. **37** connects specs **17**, **40**, and **08** into one conversational answer with an honesty floor: "no pattern I can see — sometimes chocolate is just chocolate" must be frequent by design.

1. **Trigger** only on user initiative: voiced craving questions, craving-shaped scan questions, or craving-context scans where the user engaged the scan screen.
2. **Assemble** evidence in fixed six-step order (skill-defined); answer from injected context first; at most one auxiliary history query when context is thin.
3. **Respond** in two or three sourced sentences, then one optional offer — observations never verdicts.
4. **Learn** via `craving_decoded` events → weekly `craving_correlation` `behavior_pattern` rows → faster future decodes and richer **35** pattern detection.
5. **Protect** disordered-eating threads (sacred block, no further logging/pattern-matching); cycle context only if user volunteered; craving data sensitive-class excluded from Ground/Mesa/Passport/Harvest.

Without **37**, craving moments get generic LLM guesses; stress-eating patterns lack user-initiated intervention surface; physiological + behavioral evidence never converges at the question the user actually asked.

---

## Product definition

| Term | Meaning |
|---|---|
| **Craving decode** | One conversational analysis episode — not a tracker, score, or dashboard |
| **Eating gap** | Hours since last **observed** eating event (scan/receipt/meal-log/cook) — stated as observed, not total fasting |
| **Craving history** | Prior `craving_decoded` events + matching `stress_eating` / time-of-day patterns from **35**/**17** |
| **Confabulation rule** | At most two ranked causes; below evidence threshold → honest "no pattern" |
| **Matched offer** | One optional bridge: real-food from pantry, Tonight adjustment, or flattest sweet already in user's stream |
| **Craving-context scan** | Late-night repeat scan of comfort category while user engaged scan UI — spec **17** stress-eating signature |
| **`craving-decoder` skill** | System skill (`source = 'system'`) — evidence order, language rules, offer selection, disordered-eating guard text |
| **`personality.cravings`** | Stable user-confirmed patterns in `user_memory` — e.g. "late-night sugar when short on sleep" |

**Design principle (non-negotiable):** Speaks second, never first. Explains and offers; never grades, moralizes, or suppresses. A decoder that always finds a cause is a horoscope.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/39-craving-decoder/`, `brioela-specs/52-craving-decoder.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/05`, `06`, `12`, `13`, `15`, `20`, `24`, `34`, `35`, `36`, `38`, `50`, `54`.

| Component | Type | In **37**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **Craving capture — voice/chat** | Brain chat / Mira session | **Yes** | Partial shell | User asks craving question in `chat` or `cooking`/`scan_followup` | spec **52**, **20**, **30** |
| **Craving capture — scan screen** | Mobile scan + optional Mira | **Yes** | No | Craving-shaped question or craving-context scan | spec **52**, **24** |
| **`craving-decoder` system skill** | `skills` row + seed markdown | **Yes** | No | DO init reseed; index-then-`skill_view` | `01-decoder-skill.md`, **06** |
| **Skill index line** | System prompt block **15** | **Yes** | Partial | Injected with other system skills | **06** G4 — no `craving-decoder` in seed list today |
| **Evidence assembly (6 steps)** | Skill content + optional helpers | **Yes** | No | Agent reasoning + helpers | `02-evidence-assembly.md` |
| **Physiological now read** | `user_memory.health.*` consumer | **Cross** | No | Last sleep, readiness, HRV | **36** writes; **37** reads |
| **Eating gap estimator** | Brain pure helper | **Yes** | No | Max `captured_at` of eating kinds | `estimate.eating.gap.helper` draft |
| **Craving history assembly** | Brain query helper | **Yes** | No | `kind = craving_decoded` + patterns | FTS optional — no `memory_event_fts` yet |
| **Wellbeing / stress context** | **35** consumer | **Cross** | No | This week's `wellbeing_signal` rows | **35** tables absent |
| **Travel state read** | **35** consumer | **Cross** | No | Active `travel_intent` | **35** |
| **Cycle context read** | `user_memory` consumer | **Yes** | Partial | User-volunteered only | **05** memory path exists |
| **Glucose dynamics read** | **36** consumer | **Cross** | No | Recent rapid drop; spike triggers | **36** CGM pipeline |
| **Kin flattest-alternative note** | **50** consumer | **Cross** | No | When no cause + sweet category | spec **47**, Kin overlay |
| **Synthesis + language rules** | Skill content | **Yes** | No | ≤2 causes; sourced claims | spec **52** |
| **Matched offer — pantry bridge** | **34** consumer | **Cross** | No | Cause = eating gap | `match.pantry.recipes` **34** |
| **Matched offer — Tonight adjust** | **54** consumer | **Cross** | No | Cause = short sleep | spec **51** handoff phrase |
| **Matched offer — flatter sweet** | **50**/**36** consumer | **Cross** | No | Cause = none + data exists | spec **52** |
| **`craving_decoded` memory write** | `log_memory_event` / helper | **Yes** | No | End of successful decode | spec **52** |
| **`personality.cravings` promotion** | `write_user_memory` | **Yes** | No | User confirms pattern | **05** |
| **`craving_correlation` pattern** | **35**/**12** weekly pass | **Cross** | No | Hardens from decoded events | spec **17** |
| **Disordered-eating guard** | Skill + sacred block | **Yes** | No | Compensatory/punishment language | `03-safety-guard.md`, **13** |
| **Tier gate (Core+)** | Entitlement helper | **Yes** | No | Free → brief + upgrade surface | spec **52**, **19** |
| **Privacy / deletion surfacing** | Passport **47** consumer | **Cross** | No | "What Brioela knows" | spec **52** |
| **Metrics instrumentation** | Observability | **Yes** | No | Engagement, honesty floor, guard rate | `03-safety-guard.md` |
| **Proactive craving push** | — | **No — 35/21** | — | Never from **37** | spec **52** out of scope |
| **Nutrient gap detection** | — | **No — 38** | — | Multi-week absence | spec **50** |

### Shipped in repo today (craving-decoder-related)

- `build-guide/39-craving-decoder/` — **4 files complete** (docs only).
- `brioela-specs/52-craving-decoder.md` — primary spec.
- `_records/connections/35-craving-decoder-connections.md`, `_records/build-order/36-layer-craving-decoder.md`.
- `_records/session-log/038-breakthrough-wave-ten-new-features.md` — feature listed in breakthrough wave.
- `skills` table + skill tools (**06**) — shipped; system skill list does **not** include `craving-decoder`.
- `memory_event` + `log_memory_event` (**05**) — shipped; no `craving_decoded` constant or writer.
- `buildMemoryContext()` — documented in spec **09** only; **not implemented** in `backend/src/`.
- **`rg 'craving|craving_decoded|craving-decoder|personality\.cravings' backend/src shared/ mobile/`** — zero product matches (excluding unrelated `TextDecoder` / type-guard `decoder` strings).

---

## Architecture — decode flow

```text
User trigger (one of):
  ├── Voice/chat: "Why do I want chocolate so badly?"
  ├── Scan screen: craving-shaped question while engaged
  └── Craving-context scan: late-night comfort repeat + user on scan UI

Agent (chat / scan_followup Mira / Brain chat)
        │
        ├── Disordered-eating guard check (sacred block + skill) → gentle decline, stop
        ├── Tier gate: Free → brief generic + upgrade; Core+ → full decode
        └── skill_view('craving-decoder') via index match — no keyword router

Evidence assembly (skill order; context-first):
  1. physiological now     ← user_memory.health.biometrics / sleep [36]
  2. eating gap              ← estimateEatingGap(memory_event eating kinds)
  3. craving history         ← craving_decoded + stress_eating patterns [35]
  4. context signals         ← wellbeing_signal week, travel_intent, cycle memory
  5. glucose dynamics        ← CGM recent drop; Kin flattest note [36, 50]
  6. synthesis               ← ≤2 causes OR "no pattern"

Response: 2–3 sourced sentences → one optional offer → silence
        │
        ├── Offer: pantry bridge [34] | Tonight adjust [54] | flatter sweet [50]
        └── log_memory_event kind craving_decoded (+ optional personality.cravings)

Weekly pass [35 / 12 BehaviorPatternAgent]:
  craving_decoded events → behavior_pattern_type craving_correlation
```

**Latency rule:** First sentence from injected context — never blocks on auxiliary history query. Refine if FTS/history returns more evidence.

**Honesty rule (eating gap vs negative space):** Eating gap claims **recency of observed eating events** ("nothing logged since 9am"). **38** claims **nutrient-category absence over 6+ weeks** ("omega-3 hasn't come through your kitchen"). Same observation-honesty discipline; different question, horizon, and trigger. See **37 vs 38** below.

---

## Entry surfaces (capture)

### Voice and chat

- **Brain `chat` session** (**20**): primary text/voice path when user asks craving question during general conversation.
- **Mira `scan_followup` scene** (**30**/**24**): post-scan conversational follow-up when user voices craving relative to scanned product.
- **Mira `cooking` scene** (**29**): user may ask while cooking; same skill path.

No dedicated "Craving Decoder" screen or settings toggle. Capability is invisible infrastructure loaded on demand.

### Scan screen

- **Craving-shaped scan question:** user engaged on scan UI asks why they want the scanned item (or category).
- **Craving-context scan:** spec **17** stress-eating signature — late-night repeat scans of comfort categories **where user engaged the screen**. Not silent background inference.

**Not a trigger:** background scan without user engagement; proactive "craving something?" prompt.

---

## The `craving-decoder` system skill

| Field | Value |
|---|---|
| `name` | `craving-decoder` |
| `source` | `system` |
| `description` (index) | Evidence-based analysis when the user asks why they are craving something. |
| Load path | Standard index-then-`skill_view` — **no** keyword triggers in code |
| Maintenance | Code-seeded at DO init; Brain maintenance never mutates system skills (**06**) |

Skill body owns: six-step evidence order, language rules, offer selection table, disordered-eating guard copy, confabulation threshold guidance.

---

## Evidence assembly (authoritative order)

```text
1. physiological now  — last night's sleep + today's readiness (health.biometrics, spec 40)
2. eating gap         — hours since last observed eating event; "nothing logged since..."
3. craving history    — prior craving_decoded + stress_eating / time-of-day patterns
4. context signals    — wellbeing this week (spec 17), travel state (spec 22), volunteered cycle memory
5. glucose dynamics   — CGM rapid drop if present; Kin flattest-alternative if no personal curve
6. synthesis          — ≤2 ranked causes; below threshold → "no pattern"
```

### Matched offers (one, optional)

| Cause | Offer |
|---|---|
| Eating gap | Real-food bridge from current inventory (**34** pantry estimate) |
| Short sleep | Tonight adjustment — early/light dinner factor-in (**54**) |
| No cause | Honesty + flattest sweet option user already buys (**50**/**36** when data exists) |

---

## Learning loop and data model

**No new tables** (spec **52**).

| Store | Content |
|---|---|
| `memory_event` `kind = craving_decoded` | category, named causes, evidence refs, user action next (bridge/cooked/bought/ignored) |
| `behavior_pattern` `behavior_pattern_type = craving_correlation` | Recurring cause-pairs from weekly pass (**35**/**17**) |
| `user_memory` `personality.cravings` | Stable user-confirmed patterns via `write_user_memory` |
| `skills` row | `craving-decoder` system skill |

**Weekly pass:** Decoder and pattern engine are **one loop** — decoded events consumed like any other signal; not a separate craving ML system.

---

## Safety, privacy, tier

### Disordered-eating guard

If compensatory language, punishment framing, or extreme restriction detected:

- Decline analysis gently without labeling
- Do **not** log, gamify, or pattern-match further on that thread
- Lives in skill content **and** session sacred block (**13**/**24**) — compression-immune

### Cycle context

- Only if user volunteered into memory
- Phrased as user's observed pattern — never hormonal/medical claims
- Never inferred from purchases; deletable with full effect

### Privacy

- Private Brain DO data; visible in "what Brioela knows about me" (**47**); individually deletable
- Never feeds Ground, Mesa, Passport, practitioner surfaces, Harvest (**49** sensitive-class exclusion)

### Tier

- **Core tier and above** (spec **19**) — full decode
- Degrades by **data** not gate: works from behavioral evidence without wearables
- **Free:** brief generic answer + standard inline upgrade surface

---

## Feature boundaries

### 37 vs 38 (negative space nutrition) — critical

| Dimension | **37 Craving Decoder** | **38 Negative Space Nutrition** |
|---|---|---|
| **User question** | "Why am I craving this **right now**?" | (User asks nothing — background detection) |
| **Trigger** | User-initiated voice/chat/scan engagement | Weekly alarm pass when coverage floor met |
| **Time horizon** | Minutes to hours (sleep last night, gap since last log, this week stress) | Minimum **6 weeks** qualifying coverage window |
| **Signal** | Temporal eating **gap** + physiological + emotional context | Structural **nutrient-category absence** or displacement after diet change |
| **Language** | "Nothing logged since 9am" / "your ring says five hours sleep" | "Almost nothing with omega-3 has come through your kitchen" |
| **Surfacing** | Immediate answer to user's question | Conversational mention under **17** budget (max 1 insight/week) |
| **Offer** | One bridge: eat real food now / Tonight adjust / flatter sweet | Standing concern → meal plan bias, scan note, weekly summary |
| **Shared DNA** | Observation honesty (spec **50** phrasing discipline for gaps) | Coverage gate (spec **50**) — **not** shared detection logic |
| **Budget** | Not counted against proactive insight budget (user asked) | Shares **17** weekly budget with pattern insights and growth mirror |

**37 does not detect omega-3 deficiency.** **38 does not explain why chocolate at 11pm.** If eating gap cause is "long time since observed food," **37** may offer pantry bridge; if standing concern exists for a nutrient, **38** may already bias meal plan — no duplicate gap lecture in decode copy.

### Other neighbors

| Feature | **37** owns | Neighbor owns |
|---|---|---|
| **36** wearables | Read sleep/HRV/glucose for decode | Connect, ingest, CGM windows |
| **34** pantry | Consume inventory for bridge offer | Pantry model, rescue rank, meal plan |
| **35** ambient | Consume wellbeing/stress patterns; feed `craving_decoded` to pass | Wellbeing capture, intervention budget, proactive stress-eating mention |
| **54** tonight | Handoff phrase when sleep cause | Card generation, timing, delivery |
| **50** kin | Flattest-alternative line when no personal glucose data | Cluster aggregates, opt-in |
| **12** sub-agents | — | `BehaviorPatternAgent` spawn; **35** may wrap ambient pass |
| **24** scanner | Craving-context scan hook + scan_followup entry | Product resolution, verdict |

---

## Success metrics

- Decode engagement rate (follow-up, bridge accepted vs dropped)
- Cause confirmation rate ("yeah, I barely slept")
- **"No pattern" rate** — must stay materially above zero (honesty metric)
- Bridge acceptance + downstream receipt evidence for comfort purchase
- Pattern hardening rate (`craving_decoded` → `craving_correlation`)
- Disordered-eating guard trigger rate (prevalence monitoring only — never engagement)

---

## Sources

- `brioela-specs/52-craving-decoder.md`
- `build-guide/39-craving-decoder/` (all 4 files)
- `brioela-specs/17-behavioral-food-pattern-detection.md`
- `brioela-specs/40-wearables-integration.md`
- `brioela-specs/50-negative-space-nutrition.md` (honesty boundary only)
- `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`
- `brioela-specs/51-tonight-dinner-answer.md`
- `brioela-specs/47-kin.md`
- `brioela-specs/09-per-user-brain.md` (`buildMemoryContext`, skills)
- `brioela-specs/24-technical-architecture-backbone.md` (sacred block)
- `_features/05-brain-memory-tools/spec.md`, `_features/06-brain-skill-tools/spec.md`
- `_features/20-brain-chat-runtime/spec.md`, `_features/35-ambient-intelligence/spec.md`
- `_features/36-wearables/spec.md`, `_features/34-pantry-meal-plan/spec.md`, `_features/38-negative-space-nutrition/status.md`
