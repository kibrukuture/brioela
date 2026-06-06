# Receipt Intelligence — Line Item Product Matching

## What This File Covers

Matching receipt line items to canonical products.

## Source Specs

- `brioela-specs/06-receipt-spend-intelligence.md`
- `build-guide/07-scanner/02-product-resolution.md`

## Match Order

1. Exact barcode/SKU if available.
2. Known merchant SKU if known.
3. Fuzzy label match against canonical products.
4. Category-level match.
5. Preserve as unresolved.

## Line Item Fields

- `receipt_id`
- `raw_label`
- `normalized_label`
- `quantity`
- `unit_price`
- `matched_product_id`
- `match_confidence`

## Rule

Never fabricate product matches.

Low-confidence matches stay unresolved or category-only.

## Product Resolution Reuse

Reuse scanner product corpus and product resolution helpers where possible.
