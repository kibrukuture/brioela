# Recall Alerts — Spec

Feature **31**. Personalized government recall matching against the user's product exposure history, critical push delivery orchestration (via Brain DO Path B), exposure ledger writes, recall detail + resolution UI, and retraction follow-ups.

**Not in this feature:** `scan_events` insert and barcode resolution (**24**); `schedule_user_alarm` / `recall_check` scheduled dispatch (**09**, **14** — Path B only); push provider SDK, token register, suppression tables (**21**); illness suspect ranking LLM (**32** — reads `recall_entry`); pantry/receipt/Bela exposure **sources** (**34**, **33**, **42** — emit exposure rows **31** consumes); Ground red-find styling consistency (**27** — visual only).

**Living catalog note:** FDA/EFSA/CFIA/RASFF adapters, geo-scope rules, and exposure source types will grow. New sources add normalizer + index — not a new per-user alarm type.

---

## Purpose

Government agencies issue hundreds of food recalls yearly. Generic recall apps spam product names and lot numbers; users cannot tell if a recall applies to them. Brioela cross-references active recalls against **what this user actually bought or scanned** and notifies only on match — by UPC, lot, and date window.

1. **Poll** global recall feeds (QStash cron — not per-user DO).
2. **Ingest** net-new `recall_entry` rows in Supabase.
3. **Match** each recall against all exposure records (primarily `scan_events`; unified `product_exposure` ledger over time).
4. **Notify** each affected user via Brain DO HTTP (Path B) → **21** critical push.
5. **Surface** recall detail screen with official notice, lot highlight, discard confirmation.
6. **Retract** follow-up when agency clears a recall.

Without **31**, scan history has no safety recall loop and **32** illness detective loses highest-weight recall signal.

---

## Complete pipeline inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/15-recall-alerts/`, `brioela-specs/26-personalized-recall-alerts.md`, `implementable-specs/10-scheduled-alarms.md`, `backend/src`, `shared/`.

| # | Component | Type | In **31**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **FDA feed adapter** | Global worker normalizer | **Yes** | No | QStash cron 15 min | `01-recall-feed-polling.md`, spec 26 |
| 2 | **EFSA / RASFF / CFIA adapters** | Global worker normalizer | **Yes** | No | QStash cron hourly | `01-recall-feed-polling.md` |
| 3 | **Feed diff + cursor state** | Redis or Postgres cursor | **Yes** | No | After each poll | `01-recall-feed-polling.md` |
| 4 | **`recall_entry` table** | Supabase Postgres | **Yes** | No | On net-new recall | `05-data-model.md`, spec 26 |
| 5 | **Match queue enqueue** | QStash / Workflow | **Yes** | No | Per new `recall_entry` | `01-recall-feed-polling.md`, `03-foundation/00-overview.md` |
| 6 | **Batch match worker** | Worker handler | **Yes** | No | Queue consumer | `02-recall-matching.md` |
| 7 | **`recall_scan_match` table** | Supabase Postgres | **Yes** | No | Match worker | `05-data-model.md` |
| 8 | **`product_exposure` ledger** | Supabase Postgres | **Yes** (model) | No | Exposure writers | `00-overview.md` Product Exposure Ledger |
| 9 | **Scan-time reverse check** | Path B Workflow | **Yes** | No | On `scan_events` insert (**24**) | `10-scheduled-alarms.md` `recall_check` example |
| 10 | **Brain `POST /internal/recall-match`** | Brain DO HTTP | **Yes** | No | Match worker per user | `03-critical-notification.md` |
| 11 | **`background` session on notify** | Brain session row | **Yes** (optional) | No | Path B handler | `10-scheduled-alarms.md`, `07-sessions.md` |
| 12 | **Critical push kinds** | Notification types | **Yes** trigger | No | Brain → **21** send-push | `21-platform-notifications/spec.md` |
| 13 | **`recall_alert_confirmed`** | Push `type` | **Yes** | No | Confirmed lot match | **21** critical inventory |
| 14 | **`recall_alert_probable`** | Push `type` | **Yes** | No | Broad / unknown lot | **21** critical inventory |
| 15 | **Informational downgrade** | In-app only | **Yes** | No | Lot mismatch on recall | spec 26 edge case, **21** low |
| 16 | **Retraction follow-up** | Push + row update | **Yes** | No | Feed poll detects retract | `04-recall-detail-and-resolution.md` |
| 17 | **Recall detail API** | Hono handlers | **Yes** | No | Mobile deep link | `04-recall-detail-and-resolution.md` |
| 18 | **Resolve ("I discarded it")** | API + `resolved_at` | **Yes** | No | User action | spec 26 |
| 19 | **Mobile recall detail screen** | React Native | **Yes** | No | Push tap | monorepo `features/recall/` |
| 20 | **Geo-scoped source filter** | Match rule | **Yes** | No | User scan geo + travel history | spec 26 |
| 21 | **`recall_check` scheduled alarm** | `scheduled_alarms` | **No** — obsolete | No | — | `05-alarm-system.md` — **do not implement** |
| 22 | **Illness detective recall read** | SQL read | **No** — consumer | No | **32** `run_sift` | `16-illness-detective/03-suspect-ranking.md` |

### Shipped in repo today (recall-related)

- **Zero** recall production code. `rg recall backend/src shared/` — no matches (excluding unrelated Agent `recall()` in `worker-configuration.d.ts`).
- **No** `shared/drizzle/schema/recall.schema.ts`, **no** `backend/src/api/recall/`, **no** QStash recall jobs.
- **21** defines `recall_alert_confirmed` / `recall_alert_probable` in spec only — no send integration.
- **24** `scan_events` schema not shipped — **31** blocked on match target.
- Session log `015-recall-alerts-complete.md` marks **build-guide docs** complete only — not production.

---

## Architecture — two trigger paths (hard boundary)

### Path B — event-based (authoritative for per-user work)

From `implementable-specs/10-scheduled-alarms.md`:

```text
external event fires — new recall ingested OR scan_events row inserted
        │
        ▼
Upstash Workflow / QStash (NOT scheduled_alarms, NOT DO alarm slot)
        │
        ├── Global: match worker → batch query scan_events / product_exposure
        │       → insert recall_scan_match per hit
        │       → FOR EACH user_id: HTTP → Brain DO /internal/recall-match
        │
        └── Scan-time: reverse check recall_entry for scanned UPC/lot
                → if active recall: same Brain HTTP path
        │
        ▼
Brain DO (Path B handler)
        ├── open background session (optional; sessions.alarm_type may be recall_check)
        ├── evaluate critical priority — bypass quiet hours + suppression
        ├── call send-push (**21**) with recall_alert_confirmed | recall_alert_probable
        └── write notification_log (**21**)
        │
        ▼
Mobile critical push → recall detail screen
```

**`recall_check` naming:** Implementable spec uses `recall_check` as the **example** of Path B (immediate on scan). That is **not** `alarm_type = 'recall_check'` in `scheduled_alarms`. Build-guide `05-alarm-system.md` incorrectly lists `recall_check` as a 6h scheduled type — **obsolete** (see Conflicts).

### Global polling — not Path A, not per-user DO

Recall **feed polling** is a **global** QStash cron (or dedicated scheduled Worker). It does **not** run inside any user's Brain DO and does **not** insert `scheduled_alarms` rows.

```text
QStash cron (global)
        │
        ▼
Poll FDA (15 min) / EFSA·RASFF·CFIA (hourly)
        │
        ▼
Normalize → diff cursor → INSERT recall_entry (net-new only)
        │
        ▼
Enqueue match job (QStash / Workflow: feed fetch → match → notify)
```

Source: `brioela-specs/26-personalized-recall-alerts.md`, `build-guide/15-recall-alerts/01-recall-feed-polling.md`, `build-guide/03-foundation/00-overview.md` (Workflow for recall matching).

---

## Data sources

| Source | Region | Poll interval (spec) | Notes |
|---|---|---|---|
| FDA Recalls, Market Withdrawals & Safety Alerts | US | 15 minutes | Public API, continuous update |
| EFSA | EU | Hourly | European users |
| RASFF | EU cross-border | Hourly | Supplements EFSA |
| CFIA | Canada | Hourly | Canadian users |

**Geo scope (spec 26):** User in Germany does not get FDA alerts for products never sold/scanned in US context. User who traveled to US and scanned US products continues receiving FDA alerts for those products.

---

## Matching logic

For each new or updated `recall_entry`:

1. Extract identifiers: UPC, lot numbers, brand, product name, affected date range, source region.
2. **One batch query** against Supabase `scan_events` (and `product_exposure` when ledger ships) — never one query per user.
3. For each hit: load `user_id`, scan/exposure timestamp, lot if captured.
4. **Confirmed:** scan timestamp within at-risk date range AND lot matches (or lot on scan in recalled set).
5. **Probable:** all lots recalled OR lot unknown — any scan of that product within last **90 days** (spec 26).
6. **Informational:** product matches but scanned lot clearly outside recalled lots — downgrade to in-app only, not critical push (spec 26 edge case).
7. Insert `recall_scan_match` with `match_confidence`: `confirmed` | `probable` | `informational`.
8. Route to user's Brain DO for notification (skip if `notified_at` already set for same recall+user+exposure).

**Efficiency rule:** One indexed query per recall entry against all exposure rows globally.

**Old scan rule:** Still notify if scan is old — symptoms can appear days later (`04-recall-detail-and-resolution.md`).

---

## Product exposure ledger

`build-guide/15-recall-alerts/00-overview.md` requires matching against a **unified private product exposure ledger**, not barcode scans alone.

| Exposure source | Emitting feature | **31** role |
|---|---|---|
| Barcode scan | **24** `scan_events` | Primary MVP match target |
| Receipt line item | **33** receipt intelligence | Creates `product_exposure` row |
| Bela checkout proof | **42** Bela | Creates exposure row |
| Pantry confirmation | **34** pantry | Creates exposure row |
| Manual product log | Brain `memory_event` / future API | Creates exposure row |

**MVP:** Match against `scan_events` only. **31** owns `product_exposure` schema; sibling features write rows when they ship.

Example from overview: receipt-matched yogurt never barcode-scanned still produces probable recall candidate with confidence tied to receipt match quality.

---

## Notification content and priority

**Owner of delivery rules:** **21**. **Owner of trigger + copy:** **31**.

| Confidence | Priority | Push `type` | Copy certainty |
|---|---|---|---|
| `confirmed` | **critical** | `recall_alert_confirmed` | "you have this" / scanned date + reason |
| `probable` | **critical** | `recall_alert_probable` | "you may have this" — never "you have this" |
| `informational` | **low** (in-app only) | — | Lot mismatch — no critical push |

**Critical rules (**21** / `03-critical-notification.md`):** immediate delivery; no quiet hours; no suppression; no daily cap.

**Confirmed format:**

```text
Title: Recall: [Product Name]
Body: A product you scanned on [date] has been recalled for [reason]. Check your fridge.
```

**Probable format:**

```text
Title: Recall: [Product Name]
Body: You may have a recalled product you scanned on [date]. Check your fridge.
```

**Push delivery path:** Match worker → Brain DO HTTP → Brain checks device token → **21** `send-push` → OneSignal.

---

## Recall detail screen

- Product name and photo (from scan/exposure history).
- Recall reason verbatim from issuing authority.
- Affected lot numbers (highlight user's scanned lot if in range).
- What to do: return / discard / do not consume.
- Link to official recall notice (`raw_notice_url`).
- Primary CTA: **"I discarded it"** → sets `recall_scan_match.resolved_at`.

---

## Data model summary

### Supabase (shared)

| Table | Role |
|---|---|
| `recall_entry` | Normalized government recall; `status` includes active/retracted |
| `recall_scan_match` | User↔recall↔exposure link; confidence; notify/resolve timestamps |
| `product_exposure` | Unified exposure ledger (scan, receipt, pantry, bela, manual) |
| `scan_events` | **24** writes; **31** reads for MVP matching |

**`recall_entry` fields (spec + build-guide):** `recall_id`, `source` (fda/efsa/cfia/rasff), `product_name`, `upc`, `lot_numbers_json`, `reason`, `issued_at`, `expires_at`, `raw_notice_url`, `status`, `raw_payload_json`.

**`recall_scan_match` fields:** `match_id`, `recall_id`, `user_id`, `scan_event_id` (nullable when exposure-only), `product_exposure_id` (nullable), `match_confidence`, `notified_at`, `resolved_at`.

**Indexes:** recall source + issued date; recall UPC; scan_events UPC/product_id; scan_events user_id; recall_scan_match user_id.

### Brain DO (private — **21** tables)

**31** triggers send; **21** owns `notification_log`, suppression, queue. Recall matches do **not** bypass Brain — they route **through** Brain so device token and session state are respected, while critical priority bypasses quiet hours/suppression.

---

## Retraction flow

When feed poll detects recall cleared:

1. Update `recall_entry.status` → retracted/cleared.
2. For users with prior `recall_scan_match` and `notified_at` set: enqueue Brain HTTP retraction handler.
3. Send follow-up push: "The recall for [product] has been cleared. No further action needed."
4. Preserve match history — do not delete rows.

---

## Performance and SLA

| Metric | Target (spec 26) |
|---|---|
| FDA issue → user notification | Under 30 minutes |
| Match query | One query per recall entry (batch) |
| Polling | Independent of per-user DO lifecycle |

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **31** (this) | Feed polling, ingestion, matching, exposure ledger model, Brain Path B notify handler, detail API, mobile recall UI, retraction |
| **24** | `scan_events` insert; scan-time hook invokes **31** reverse check |
| **09** | `schedule_user_alarm` — **does not** schedule `recall_check` |
| **14** | Alarm dispatch — **no** `recall_check` case |
| **21** | Push delivery, critical bypass rules, `recall_alert_*` kinds |
| **32** | Reads active `recall_entry` for illness ranking — does not ingest feeds |
| **34** / **33** / **42** | Write `product_exposure` rows — do not own recall matching |
| **27** | Ground red-find visual consistency with recall styling — not data pipeline |

### Overlap resolution

| Situation | Owner |
|---|---|
| User scans product → immediate recall check | **31** Path B on scan event (**24** calls) |
| FDA publishes new recall overnight | **31** global poll → batch match → per-user Brain |
| Push at 2am for Listeria | **31** triggers; **21** critical bypass |
| Lot mismatch on recall | **31** informational in-app; not **21** critical |
| `recall_check` every 6h in Brain alarm table | **Obsolete** — global cron replaces per-user poll |
| Illness "RECALL ACTIVE" tag on suspect | **32** reads **31** `recall_entry` |

---

## Conflicts and naming drift

| Conflict | Resolution |
|---|---|
| `05-alarm-system.md`: `recall_check` every 6h in `scheduled_alarms` | **Obsolete.** Prefer `10-scheduled-alarms.md` Path B + global QStash poll (**14** spec G8, **09** spec) |
| `06-brain-memory/01-sqlite-schema.md`: first-boot seed `recall_check` alarm | **Obsolete** with Path B — remove at Brain init implementation |
| `07-agent-framework-hardening.md` lists `recall check` in scheduled alarm examples | Document as historical; recall pipeline = Workflow |
| Spec 26: `recall_alert` record vs build-guide `recall_scan_match` | Use `recall_scan_match` table name from build-guide |
| `memory_event` vs `scan_events` for global match | **Supabase `scan_events`** for cross-user batch query; Brain `memory_event` is per-user private |
| Exposure ledger in overview vs spec 26 scan-only wording | **31** owns ledger; MVP matches `scan_events`; spec 26 intent preserved via ledger roadmap |
| brioela-spec 26: "Push routed through Brain DO" vs Path B HTTP | Consistent — Workflow calls Brain HTTP endpoint |
| Generative grammar static `recall` safety layer | **52** renders; **31** supplies data |

### Obsolete / absent ledgers

- `_records/session-log/015-recall-alerts-complete.md` — build-guide written 2026-06-06; **no production implementation followed**.
- No `_records/implementation-ledger/` entries for recall alerts.
- `_records/build-order/13-layer-recall-alerts.md` — layer index only; `_features/31` supersedes for tracking.

---

## Success metrics (spec 26)

- Recall match notification delivery rate (alerts sent vs qualifying matches).
- User "I discarded it" confirmation rate.
- Time from FDA recall issue to user notification (target under 30 minutes).
- Retention: users who receive recall alert and return within 24 hours.

---

## Sources (read for this migration)

### Build guides — recall (all files)
- `build-guide/15-recall-alerts/00-overview.md`
- `build-guide/15-recall-alerts/01-recall-feed-polling.md`
- `build-guide/15-recall-alerts/02-recall-matching.md`
- `build-guide/15-recall-alerts/03-critical-notification.md`
- `build-guide/15-recall-alerts/04-recall-detail-and-resolution.md`
- `build-guide/15-recall-alerts/05-data-model.md`

### Build guides — cross-refs
- `build-guide/05-brain/05-alarm-system.md` (obsolete `recall_check` scheduled — document conflict)
- `build-guide/05-brain/07-agent-framework-hardening.md` (Workflow recall pipeline)
- `build-guide/06-brain-memory/01-sqlite-schema.md` (obsolete recall_check seed)
- `build-guide/07-scanner/00-overview.md`, `01-barcode-decode.md` (scan_events match target)
- `build-guide/12-notifications/01-priority-model.md`, `03-suppression-state.md`, `06-data-model-and-tools.md`
- `build-guide/16-illness-detective/00-overview.md`, `03-suspect-ranking.md`
- `build-guide/03-foundation/00-overview.md`, `02-backend-worker-setup.md`, `03-database.md`
- `build-guide/02-coding-standards/01-monorepo-and-folder-structure.md`, `08-shared-package-zod.md`

### Brioela specs
- `brioela-specs/26-personalized-recall-alerts.md` (PRIMARY)
- `brioela-specs/08-personal-food-brain-memory.md` (recall use case)
- `brioela-specs/30-food-illness-detective.md` (recall cross-ref)
- `brioela-specs/23-ambient-notification-strategy.md` (critical recall priority)
- `brioela-specs/35-ground-community-intelligence.md` (visual consistency)
- `brioela-specs/42-brioela-generative-grammar.md` (static recall safety layer)

### Implementable specs
- `implementable-specs/10-scheduled-alarms.md` (Path B authoritative)
- `implementable-specs/07-sessions.md` (`recall_check` session alarm_type note)
- `implementable-specs/01-memory-event.md` (entity index for per-user recall queries)
- `implementable-specs/brioela-tools/11-schedule-user-alarm.md` (NOT for recall)
- `implementable-specs/00-overview.md`

### Records
- `_records/connections/11-recall-alerts-connections.md`
- `_records/build-order/13-layer-recall-alerts.md`
- `_records/session-log/015-recall-alerts-complete.md`

### Neighbor feature migrations
- `_features/09-brain-alarm-tools/spec.md`
- `_features/14-brain-alarm-dispatch/spec.md`, `draft/recall.check.boundary.gap.md`
- `_features/21-platform-notifications/spec.md`
- `_features/24-scanner/spec.md`
