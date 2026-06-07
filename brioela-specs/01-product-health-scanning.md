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
- GPT-4o mini vision extraction and label/image fallback when barcode is missing.
- Product lookup against external food datasets.
- Evidence-weighted product fact resolution.
- Rule-based scoring plus personal and community evidence overlays.
- User-specific filtering for allergies and dietary constraints.
- Anonymous community post-exposure event association context.

## Out of Scope
- Community note authoring.
- Long-form nutritional coaching.
- Live cooking guidance.

## Inputs
- Camera frame stream.
- User location for local availability context.
- User memory profile from the personal agent.
- Product datasets such as Open Food Facts and country-specific public food databases.
- Product fact evidence records: source, confidence, observed value, and safety approval state.
- Cached Brioela community health summaries and ingredient event association indexes.

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
- Medication-food interaction rules apply against the user's private medication data.
- Community evidence overlay can add yellow caution context when anonymous users with similar profiles report post-exposure events.
- Response returns a compact payload for immediate UI display.

The scanner is not a simple external-score fetcher. External datasets answer "what is this product?" and "what does the label/source say?" Brioela combines those facts with product-fact evidence, private Orchestrator DO memory, and anonymous community event associations before returning the final verdict.

Computation spine:

```text
resolved product identity
→ product fact evidence + confidence
→ base nutrient/additive score
→ hard personal constraints
→ medication-food interaction rules
→ cached product_community_health_summary
→ cached ingredient event association signals
→ personalized verdict
```

Community evidence can upgrade green to yellow with careful wording. It cannot clear allergens, cannot diagnose, and cannot create a hard red block by itself unless it maps to a confirmed hard safety rule.

## Data Model
- `scan_event`: user_id, product_id, raw_scan_type, captured_at, geo_hash, device_confidence.
- `product_profile`: canonical_id, barcode, brand, ingredients, nutrients, origin, additives, source_refs.
- `product_fact_evidence`: product_id, field_name, source_type, observed_value_json, confidence_score, approved_for_safety_decisions.
- `product_community_health_summary`: product_id, community_health_confidence_score, reported_event_rate, condition_tags_with_elevated_event_rates.
- `scan_result`: scan_event_id, base_score, user_adjusted_score, verdict, reasons_json, community_health_context_json.

## API Surface
- `POST /api/scans/resolve`
- `POST /api/scans/score`
- `GET /api/products/:id`

## Performance Constraints
- First visible verdict target: < 3s total.
- Cached product lookups should return in < 500ms server time.
- Product scoring must degrade gracefully if enrichment sources fail.

## Failure Handling
- If barcode resolution fails, fall back to GPT-4o mini vision extraction plus image classification.
- If no product identity can be resolved, store a pending scan for later enrichment.
- If external dataset conflicts exist, expose the confidence level in the expanded details only.
- If community evidence exists but is weak or unsupported, keep it hidden or secondary.
- If community evidence is strong and relevant to the user's profile, add yellow caution context without causal or clinical language.

## Success Metrics
- Scan-to-verdict latency.
- Product resolution rate.
- Repeat scans per weekly active user.
- Upgrade rate after repeated scans.
