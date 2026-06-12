# Draft: community-health.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/community-health.schema.ts`

Source: `build-guide/29-health-intelligence/04-community-health-tables.md` (full Drizzle + indexes + RPCs in Supabase migration).

**Gap G10:** No Postgres community health tables in `shared/drizzle/` today.

Eight tables:

1. `anonymous_health_groups`
2. `anonymous_exposure_event_associations`
3. `anonymous_ingredient_event_association_index`
4. `product_community_health_summary`
5. `anonymous_medication_food_event_associations`
6. `anonymous_time_of_day_event_patterns`
7. `anonymous_region_event_patterns`
8. `anonymous_research_association_candidates`

Key constraints:

- `k_anonymity_group_size >= 100` CHECK on `anonymous_health_groups`
- Unique indexes per `04-community-health-tables.md` (`uq_anonymous_exposure_event_association`, etc.)
- Postgres RPCs: `upsert_exposure_event_association`, `decay_exposure_event_recency_weights`, `increment_product_conflict`
- Materialized views: `mv_top_ingredient_event_associations`, `mv_flagged_products`

HealthInsightAgent Pass 3 calls RPCs via `write_community_health_signal` executable — never writes identifiable user rows.

Scanner consumer: `build-guide/07-scanner/07-community-product-intelligence.md`.

Full schema body: see `04-community-health-tables.md` lines 29–235 — copy verbatim at implementation; too large for gap stub duplication.
