# 01. Product Health Scanning

## Goal
Allow a user to point the camera at a grocery product and receive an immediate health-oriented result with minimal interaction. The scan result is the primary acquisition and retention loop for Brioela.

## User Outcome
- Open camera.
- Detect barcode or front label without form input.
- Return a result in under 3 seconds.
- Show a simple primary verdict first: `green`, `yellow`, or `red`.
- Allow expansion into details only on demand.

## In Scope
- Barcode scan.
- OCR and label/image fallback when barcode is missing.
- Product lookup against external food datasets.
- Rule-based and model-assisted scoring.
- User-specific filtering for allergies and dietary constraints.

## Out of Scope
- Community note authoring.
- Long-form nutritional coaching.
- Live cooking guidance.

## Inputs
- Camera frame stream.
- User location for local availability context.
- User memory profile from the personal agent.
- Product datasets such as Open Food Facts and country-specific public food databases.

## Outputs
- Primary status color.
- One-sentence reason.
- Structured explanation payload.
- Follow-up actions such as save, compare, add note, open map, or set avoidance.

## System Design
- Client performs on-device barcode detection first for latency.
- Worker route receives normalized scan payload.
- Per-user agent enriches with user-specific constraints.
- Shared product service resolves canonical product identity.
- Scoring engine computes base health score.
- Guardrail layer applies allergy and dietary overrides.
- Response returns a compact payload for immediate UI display.

## Data Model
- `scan_event`: user_id, product_id, raw_scan_type, captured_at, geo_hash, device_confidence.
- `product_profile`: canonical_id, barcode, brand, ingredients, nutrients, origin, additives, source_refs.
- `scan_result`: scan_event_id, base_score, user_adjusted_score, verdict, reasons_json.

## API Surface
- `POST /api/scans/resolve`
- `POST /api/scans/score`
- `GET /api/products/:id`

## Performance Constraints
- First visible verdict target: < 3s total.
- Cached product lookups should return in < 500ms server time.
- Product scoring must degrade gracefully if enrichment sources fail.

## Failure Handling
- If barcode resolution fails, fall back to OCR plus image classification.
- If no product identity can be resolved, store a pending scan for later enrichment.
- If external dataset conflicts exist, expose the confidence level in the expanded details only.

## Success Metrics
- Scan-to-verdict latency.
- Product resolution rate.
- Repeat scans per weekly active user.
- Upgrade rate after repeated scans.
