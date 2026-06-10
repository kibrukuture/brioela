# Kin — Fingerprint and Cluster Assignment

## What This File Covers

The in-DO response fingerprint and how a user gets a cluster.

## Source Specs

- `brioela-specs/47-kin.md`

## The Fingerprint

Computed inside the user's Brain DO from their own `glucose_meal_window` derived values. A small normalized vector:

- typical peak delta across high-glycemic reference categories (refined carbs, white rice, fruit juice, bread)
- typical time-to-peak and return-to-baseline speed
- fasting baseline band
- response variance (stable vs. volatile responder)

## Assignment

- Floor: minimum 10 meal windows before any assignment exists. Below it: no contribution, no Kin row, silence.
- Assignment = nearest centroid from the global `kin_cluster` table; recomputed monthly by the DO alarm cycle as the fingerprint matures.
- Only the resulting cluster_id is transmitted. The fingerprint never leaves the DO.

## Cluster Count

Start coarse: 8–16 clusters. Centroids maintained globally from contributed aggregates. Re-tuning cluster count is a deliberate operational event (it invalidates assignments), not a continuous process.

## Rule

Private data does the math at home. The network only ever learns which group the user resembles — never why.
