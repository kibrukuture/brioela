# Scanner — Product Data Provenance And Correction

## What This File Covers

How Brioela tracks where product facts came from, how conflicting product data is ranked, how GPT-4o
mini vision extraction fits into product resolution, and how users can correct product data with
label evidence. This is required for trust: ingredient, allergen, recall, origin, and boycott logic
must never look like magic.

---

## Core Rule

Every product fact has provenance.

Brioela must know:

- source name
- source type
- source timestamp
- confidence
- whether the value was user-corrected
- whether the value came from label evidence
- whether the value is safe enough for constraint decisions

No product fact should appear in safety logic without a source record.

---

## Source Priority

Product data sources are ranked by use case.

| Priority | Source | Use |
|---|---|---|
| 1 | User-submitted label photo with GPT-4o mini structured extraction | current label truth for this scan |
| 2 | GS1 / Verified by GS1 where available | GTIN/company identity and product identity validation |
| 3 | Open Food Facts API/export | broad global product corpus |
| 4 | USDA FoodData Central | US nutrient/branded food enrichment |
| 5 | Country-specific government databases | local enrichment where available |
| 6 | Commercial barcode/product APIs | fallback when open/official sources fail |
| 7 | Community correction pending review | candidate truth, not safety truth until accepted |

Open Food Facts is still the broad default corpus. GS1 is for identity validation where available.
USDA is for US nutrient enrichment, not global identity. GPT-4o mini extraction is for what the
current package label visibly says.

---

## GPT-4o Mini Vision Extraction Role

GPT-4o mini vision extraction is not a generic suggestion layer. It returns structured data under a
Zod schema.

Allowed extraction targets:

- product name
- brand
- visible ingredients
- visible allergen statement
- visible nutrition panel
- net weight / serving size
- country/origin text if visible
- warnings and uncertainty flags

The model output must be parsed by schema before any product logic uses it.

Example output:

```typescript
type ProductLabelExtraction = {
  productName: string | null
  brand: string | null
  ingredients: string[]
  allergenStatement: string | null
  nutrition: Record<string, number> | null
  originText: string | null
  confidence: number
  warnings: Array<
    | "low_light"
    | "partial_label"
    | "text_too_small"
    | "vision_extraction_uncertain"
    | "non_food_item"
  >
}
```

---

## Provenance Model

```typescript
type ProductFactSource = {
  sourceId: string
  productId: string
  factPath: string
  sourceType:
    | "label_gpt4o_mini"
    | "open_food_facts"
    | "gs1_verified"
    | "usda_fdc"
    | "government_database"
    | "commercial_product_api"
    | "user_correction"
  valueJson: string
  confidence: number
  observedAt: number
  acceptedForSafety: boolean
}
```

Examples of `factPath`:

```text
ingredients
allergen_statement
nutrition.sugar_g
origin.country
brand
product_name
```

---

## Correction Flow

When a user says product data is wrong, Brioela asks for evidence, not a form.

Accepted evidence:

- current label photo
- ingredient list photo
- allergen statement photo
- nutrition panel photo
- official product page URL

Flow:

1. User taps or says: "This is wrong."
2. Brioela asks for a label photo or URL.
3. GPT-4o mini extracts structured facts from the evidence.
4. Brioela compares current product facts to extracted facts.
5. If confidence is high and the correction affects non-critical facts, update product fact source.
6. If correction affects allergen/medical/recall logic, mark as `review_required` before shared acceptance.
7. The current user's scan can still use the visible-label extraction with a clear caveat.

---

## Safety Boundary

For hard allergy, medical hard flags, and recall alerts:

- If the label extraction says an allergen exists, block immediately.
- If sources conflict, choose the safer outcome.
- If confidence is low, show uncertainty and ask user to verify label.
- Do not downgrade a hard safety block based only on a single unreviewed correction.

Safe example:

```text
The label photo does not show peanuts, but Open Food Facts lists peanuts. I cannot clear this for you yet. Please verify the full ingredient list.
```

---

## Data Model Additions

```sql
CREATE TABLE product_fact_source (
  source_id            text primary key,
  product_id           text not null,
  fact_path            text not null,
  source_type          text not null,
  value_json           text not null,
  confidence           real not null,
  observed_at          integer not null,
  accepted_for_safety  integer not null default 0
);

CREATE TABLE product_correction_request (
  request_id       text primary key,
  user_id          text not null,
  product_id       text not null,
  evidence_type    text not null,
  evidence_ref     text not null,
  status           text not null, -- pending | accepted | rejected | review_required
  created_at       integer not null,
  resolved_at      integer
);
```

---

## Provider Notes

- Open Food Facts has public data exports and live API access with broad global coverage.
- USDA FoodData Central provides public-domain food details and search endpoints, useful for US enrichment.
- GS1 Verified by GS1 verifies GTIN/company/product identity and can link to authoritative product data where available.
- Commercial product APIs are fallback providers, not first-party truth.

---

## What This File Depends On

- `02-product-resolution.md` — product lookup and canonical product records.
- `05-gpt4o-mini-vision-fallback.md` — label extraction when barcode fails.
- `03-constraint-check.md` — safety logic consuming product facts.

## What Depends On This File

- Recall alerts.
- Origin and boycott filters.
- Bela shopper scan enforcement.
- Menu/receipt confidence patterns where product facts are derived from images.
