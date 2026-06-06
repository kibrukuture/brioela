# Receipt Intelligence — Receipt Ingestion

## What This File Covers

Receipt capture, upload, raw OCR persistence, and initial receipt record creation.

## Source Specs

- `brioela-specs/06-receipt-spend-intelligence.md`
- `build-guide/07-scanner/05-ocr-fallback.md`

## API Surface

- `POST /api/receipts/ingest`
- `GET /api/receipts/:id`

## Flow

1. User captures receipt image.
2. Client uploads image.
3. Backend creates `receipt` row.
4. Backend stores raw OCR result separately.
5. Normalization runs after OCR.
6. Uncertain lines are preserved.

## Receipt Record

Fields:

- `receipt_id`
- `user_id`
- `merchant_name`
- `captured_at`
- `subtotal`
- `total`
- `currency`

## Rule

Never overwrite raw OCR. Store raw OCR separately so model upgrades can reprocess later.
