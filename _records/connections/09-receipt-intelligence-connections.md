# Connections — Receipt Intelligence

spec: brioela-specs/06-receipt-spend-intelligence.md
  → build-guide/13-receipt-intelligence/00-overview.md [x] done
  → build-guide/13-receipt-intelligence/01-receipt-ingestion.md [x] done
  → build-guide/13-receipt-intelligence/02-ocr-and-normalization.md [x] done
  → build-guide/13-receipt-intelligence/03-line-item-product-matching.md [x] done
  → build-guide/13-receipt-intelligence/04-spend-summaries.md [x] done
  → build-guide/13-receipt-intelligence/06-receipt-ui-and-voice.md [x] done

spec: brioela-specs/29-food-cost-inflation-tracker.md
  → build-guide/13-receipt-intelligence/05-price-history-and-alerts.md [x] done
  → build-guide/13-receipt-intelligence/06-receipt-ui-and-voice.md [x] done

build-guide: build-guide/07-scanner/
  → build-guide/13-receipt-intelligence/01-receipt-ingestion.md [x] done (OCR pipeline reuse)
  → build-guide/13-receipt-intelligence/03-line-item-product-matching.md [x] done (product resolution reuse)

build-guide: build-guide/10-map/
  → build-guide/13-receipt-intelligence/05-price-history-and-alerts.md [x] done (shared price signal boundary)

build-guide: build-guide/11-bela/
  → build-guide/13-receipt-intelligence/01-receipt-ingestion.md [x] done (receipt OCR reuse)
