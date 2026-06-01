# 03. Hyperlocal Community Notes

## Goal
Attach local, product-specific notes to scanned food items so nearby users can benefit from real usage feedback that is more contextually relevant than global reviews.

## User Outcome
- Scan a product.
- See short local notes only when relevant.
- Add a concise note after purchase or use.

## In Scope
- Product-linked note creation.
- Geo-scoped note visibility.
- Light moderation and abuse prevention.
- Ranking notes by local relevance and trust.

## Out of Scope
- Generic social feed.
- Threaded long-form discussion.

## Core Rules
- Notes are attached to canonical products.
- Visibility is scoped by geographic radius or city cluster.
- Only short, structured notes should surface inline during scan.
- Notes must be rankable by freshness, proximity, and reporter trust.

## Data Model
- `community_note`: note_id, product_id, author_user_id, geo_hash, body, sentiment, created_at, status.
- `note_signal`: note_id, helpful_count, report_count, local_view_count.
- `note_visibility_window`: note_id, region_id, start_at, end_at.

## API Surface
- `POST /api/community-notes`
- `GET /api/products/:id/community-notes`
- `POST /api/community-notes/:id/report`

## Ranking Inputs
- Distance from current user.
- Time since posted.
- Whether the author has repeated scan/use history on similar products.
- Note helpfulness and moderation risk.

## Moderation Requirements
- Rate limiting per user and per product.
- Spam detection on repeated text.
- Toxicity and defamation filtering.
- Soft delete with audit trail.

## Success Metrics
- Percentage of scans with at least one local note.
- Note helpfulness rate.
- Report rate per thousand notes.
