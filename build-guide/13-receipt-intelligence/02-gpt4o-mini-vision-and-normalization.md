# Receipt Intelligence — GPT-4o Mini Vision And Normalization

## What This File Covers

Receipt image extraction with GPT-4o mini, merchant normalization, line extraction, and uncertainty handling.

## Source Specs

- `brioela-specs/06-receipt-spend-intelligence.md`

## GPT-4o Mini Vision Output

GPT-4o mini returns structured output validated by Zod. Product logic reads only validated fields,
not prose. If the model output fails schema validation, the receipt stays unresolved and can be
retried or reviewed later.

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
