# Kin — Aggregate Tables and K-Anonymity

## What This File Covers

The shared Supabase tables and the hard anonymity gates.

## Source Specs

- `brioela-specs/47-kin.md`

## Tables (Supabase Postgres, shared)

```sql
kin_cluster (
  cluster_id    text primary key,
  centroid_json text not null,
  member_count  integer not null,   -- approximate, for k-anonymity checks
  updated_at    timestamptz
)

product_kin_response (
  product_id        text,
  cluster_id        text,
  sample_count      integer not null,
  spike_rate        real,
  median_peak_delta real,
  median_auc        real,
  updated_at        timestamptz,
  primary key (product_id, cluster_id)
)
```

## Anonymization Rules (enforced at write, not by convention)

- Contributions carry: cluster_id, product_id, derived values. Nothing else.
- No user_id. No hashed user_id. (Stricter than Ground — there is no abuse-prevention identity here at all; abuse surface is rate-limited at the contribution pipeline instead.)
- No timestamp finer than a 7-day bucket.

## Serving Gates (hard)

A `product_kin_response` row is readable only when:

- `sample_count >= 20` distinct contribution events, AND
- the cluster's `member_count >= 100`

Below either floor the row exists and serves no one. The gate lives in the read path, checked on every serve.

## Rule

These floors are serving gates, not guidelines. There is no admin override and no "beta" exception.
