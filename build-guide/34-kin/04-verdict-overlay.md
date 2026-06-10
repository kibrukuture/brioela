# Kin — Verdict Overlay

## What This File Covers

How Kin data appears in scan verdicts, recipes, and plans.

## Source Specs

- `brioela-specs/47-kin.md`
- `brioela-specs/01-product-health-scanning.md`

## Trust Order

```
1. user's own glucose history for this product   ← always wins
2. Kin cluster response (if serving gates pass)  ← fills the cold start
3. population glycemic data                       ← generic fallback
```

When 1 and 2 disagree, both can show: "Your own data: flat. (Your group tends to spike — you're an exception on this one.)"

## Wording Rules

- Group tendency language only: "usually", "tends to", "for people like you" with the sample framing ("n=1,400, 80% spiked").
- Never causal, never clinical, never predictive ("will spike" is banned output).
- May add caution or reassurance framing. May never override an allergen or condition flag. May never create a hard red block by itself.

## Read Path

`product_kin_response` is read through the standard Upstash Redis product cache with TTL — one extra cached lookup inside the existing verdict assembly. The 3-second scan target does not move.

## Downstream Consumers

- Recipe ranking and meal plan generation use cluster response where personal data is absent and gates pass.
- In-store co-pilot swaps and craving-decoder alternatives cite Kin data with the same wording rules.

## Rule

The Kin row appears only when it can say something gated, sampled, and phrased as tendency. No data, no row — never a placeholder.
