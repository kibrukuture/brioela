# Receipt Intelligence — OCR And Normalization

## What This File Covers

Receipt OCR, merchant normalization, line extraction, and uncertainty handling.

## Source Specs

- `brioela-specs/06-receipt-spend-intelligence.md`

## OCR Output

Capture:

- raw text
- merchant candidate
- date/time candidate
- subtotal/total/tax candidates
- line item candidates
- confidence
- warnings

## Normalization

Normalize:

- merchant name
- currency
- date/time
- line labels
- quantity
- unit price
- total price

## Uncertain Lines

Do not drop uncertain lines.

Store them as unresolved line items for later reprocessing.

## Merchant Matching

Merchant normalization should link to map place when confidence is high.

If no place match exists, keep merchant text and location metadata for later resolution.
