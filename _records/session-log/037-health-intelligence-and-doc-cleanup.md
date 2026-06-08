# Session 037 — Health Intelligence And Architecture Cleanup

## Date

2026-06-07

## Completed This Session

Cleaned and canonicalized docs only.

Scanner:
- Rewrote `build-guide/07-scanner/02-product-resolution.md` cleanly after a broken/interleaved rewrite.
- Added `build-guide/07-scanner/06-product-data-provenance-correction.md`.
- Added/kept `build-guide/07-scanner/07-community-product-intelligence.md` and aligned it with health-intelligence direction.
- Updated `build-guide/07-scanner/00-overview.md`.

Health Intelligence:
- Added `build-guide/29-health-intelligence/` with five files.
- Confirmed no separate `medication_reminders` table: medication reminders are `scheduled_alarms` rows.
- Added `action_outcome_status` and `action_outcome_json` to `scheduled_alarms` in memory schema docs.
- Replaced narrow biometric/document tables with one generic `health_captures` table.
- Updated Health Agent docs to be Brain-owned and ambient, not chat-first.

Global cleanup:
- Removed all Markdown references to the old realtime provider path. Current realtime transport is Cloudflare Realtime / RealtimeKit only.
- Removed old image-extraction wording from Markdown. Image/text extraction is GPT-4o mini vision extraction with Zod-enforced structured output.
- Updated Bela stale payment references to the final PaymentIntent manual capture + Stripe Connect Express + registered Bela card model.
- Locked OneSignal-only notifications and Supabase Auth-only auth wording.
- Added Brioela-owned wearable connector direction.

## Key Decisions

- External product providers describe label/product facts. Brioela health intelligence describes real-world outcome signals.
- Community health signals can add caution, usually green to yellow. They do not diagnose and do not create hard red blocks by themselves.
- Product facts require provenance.
- User correction requires label/URL evidence.
- Safety-impacting corrections require review before shared acceptance.
- `scheduled_alarms` remains the permanent product-owned alarm ledger.
- Agents SDK `schedule()` may wake/call methods, but `scheduled_alarms` stores the product meaning and outcome.

## Files Added

- `build-guide/07-scanner/06-product-data-provenance-correction.md`
- `build-guide/07-scanner/07-community-product-intelligence.md`
- `build-guide/29-health-intelligence/00-overview.md`
- `build-guide/29-health-intelligence/01-medication-tracking.md`
- `build-guide/29-health-intelligence/02-medication-reminders.md`
- `build-guide/29-health-intelligence/03-health-agent.md`
- `build-guide/29-health-intelligence/04-community-health-tables.md`
- `_records/connections/26-health-intelligence-connections.md`
- `_records/build-order/27-layer-health-intelligence.md`
- `_records/session-log/037-health-intelligence-and-doc-cleanup.md`

## Verification

- No Markdown references remain for the old realtime provider name.
- No Markdown references remain for old image-extraction terminology.
- No Markdown references remain for rejected provider suggestions from the architecture audit.

## What Is Next

Before coding, run one final consistency pass on Health Intelligence table names and scanner community table naming, especially around association/correlation language.
