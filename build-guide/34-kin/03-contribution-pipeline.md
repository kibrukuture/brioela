# Kin — Contribution Pipeline

## What This File Covers

How derived values flow from the Brain DO into the aggregates.

## Source Specs

- `brioela-specs/47-kin.md`

## Flow

1. A glucose meal window closes in the Brain DO (wearables build, `20-wearables/04`), derived values computed.
2. If `kin_state.opted_in` and a cluster assignment exists: the DO fires a contribution as a QStash job — fire-and-forget, never blocking scan or session paths.
3. The contribution endpoint validates shape, strips anything beyond the allowed fields, applies the 7-day time bucket, and queues the row.
4. The user's own `kin_contribution_log` records what was shared (product, window ref, when) — visible in "what Brioela knows about me", deletable.

## Recomputation

- Aggregates recompute as a scheduled Supabase batch job, hourly. This data is tendency, not real time.
- Opt-out withdrawals and contribution-log deletions mark affected rows; the next batch recomputes without them.

## Rate Limiting

Contribution volume is naturally bounded (meal windows per user per day), but the endpoint still rate-limits per source to keep the abuse surface closed without identity: token-scoped limits at the Worker layer.

## Rule

The contribution path can fail silently and lose nothing important — aggregates are statistics, not records. The user's private data in the DO is always the source of truth for their own experience.
