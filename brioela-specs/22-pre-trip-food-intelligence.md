# 22. Pre-Trip Food Intelligence

## Goal

When a user signals they are traveling to a new location, Brioela pre-loads food intelligence for that destination so they arrive already knowing what to scan, what to avoid, and where healthy food is.

## User Outcome

- User mentions a trip: "I'm going to Tokyo next week", "flying to London tomorrow".
- Before they arrive, Brioela quietly prepares: community notes from that region, locally available healthy products, map of healthy food options near their destination, local products known to be problematic or highly rated.
- They land and the app is already ready for where they are. No setup. No search. It just knows.

## Signal Sources for Travel Intent

The agent detects travel intent from:

1. **Voice mention during any session**: "going to X", "traveling to X", "visiting X". Picked up from transcript events in any voice session and passed to the Orchestrator DO.
2. **Calendar integration (optional, user-granted)**: if the user connects their calendar, flight or accommodation events are parsed for destination and date.
3. **Manual city search on the map**: if a user searches a city far from their current location more than once, this is a travel intent candidate.

The Orchestrator DO records the inferred destination and departure date. If confidence is high (explicit voice mention or calendar event), it triggers pre-loading without asking. If confidence is low (single map search), it may confirm once: "Are you heading to [city]?"

## What Gets Pre-Loaded

When a confirmed travel destination is detected, the Orchestrator DO schedules a background job via Upstash QStash:

1. **Community notes for the destination region**: fetch high-trust community notes for top scanned products in that city/country. Store locally for offline access.
2. **Local product landscape**: what food brands and products are common in that country. What government food databases apply. Update the scan resolution priority to prefer local databases when the user is in that location.
3. **Healthy food map pre-fetch**: load map places, farmers markets, health stores, and rated restaurants in the destination city. Cache in Upstash Redis with a geo-region key.
4. **Local dietary context**: any country-specific food labeling norms, known additive lists that differ from the user's home country, local halal/kosher/vegan certification bodies (if relevant to user's dietary identity).
5. **Language adjustment**: if the destination country uses a different primary language for food labels, note this so the OCR and label parsing layers use the correct language model.

## Notification Behavior

When the pre-loading is complete (typically done before the user's departure date), the agent surfaces one quiet notification:

"You're heading to [city]. I've loaded food intel for the area — local products, healthy spots nearby, and what to watch out for."

No dashboard to open. If the user opens the app after arriving, the map and scan results already reflect the local context automatically.

## Location Switch

When the user's device location changes to the destination region (detected on next app open), the Orchestrator DO:
- Activates the pre-loaded local database priority.
- Switches map context to the destination city.
- Applies any local dietary labeling norms to scan scoring.

When they return home, the same logic reverts. Travel context is stored as a time-bounded layer, not a permanent override.

## Data Model

- `travel_intent`: user_id, destination_city, destination_country, departure_date, confidence, detected_source, status (pending, confirmed, active, expired).
- `travel_preload_job`: intent_id, job_type, status, completed_at.
- `travel_local_cache`: user_id, geo_region, cache_type, payload_json, expires_at.

## API Surface

- `POST /api/agent/events` with event type `travel.intent_detected` — received by Orchestrator DO.
- `POST /api/travel/preload` — internal worker-to-worker call, triggered by QStash job.
- `GET /api/travel/status` — check whether pre-loading is complete for active travel intent.

## Privacy Note

Travel intent data is stored only in the per-user Orchestrator DO and in the user-scoped travel cache. It is never used for advertising targeting. Destination data is deleted when travel status expires (30 days after estimated return).

## Success Metrics

- Travel intent detection rate (how often the agent correctly identifies a trip).
- Pre-load completion rate before departure date.
- Map engagement rate in destination city (proxy for usefulness of pre-loaded data).
- Scan resolution rate using local databases while traveling vs. home baseline.
