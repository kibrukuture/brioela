# 05. Origin, Supply Chain, And Boycott Filters

## Goal
Expose origin and supply-chain context for food products and allow users to apply personal country, company, or sourcing filters during scanning and discovery.

## User Outcome
- Scan a product.
- See country of origin and ownership context.
- Apply persistent personal boycott or avoidance filters.

## In Scope
- Country of origin display.
- Manufacturer and parent-company linkage.
- User-maintained boycott rules.
- Scan and map-level flagging.

## Out of Scope
- Political recommendation engine.
- Editorialized geopolitical content.

## Data Model
- `origin_profile`: product_id, origin_country, manufacturing_country, parent_company_id, source_refs.
- `boycott_rule`: user_id, rule_type, target_id, target_label, created_at, active.
- `boycott_match_event`: user_id, product_id, matched_rule_id, matched_at.

## Processing Rules
- Rules are factual and user-defined.
- Product flagging must happen inside the per-user resolution flow.
- Expanded UI may show why a match occurred, but the collapsed scan view should stay compact.

## API Surface
- `POST /api/boycott-rules`
- `GET /api/boycott-rules`
- `GET /api/products/:id/origin`

## Constraints
- Source transparency is required because origin data is often incomplete or conflicting.
- Product ownership lineage should be versioned over time.

## Success Metrics
- Number of active boycott rules per retained user.
- Match frequency during scans.
- Reduction in repeat scans of avoided products.
