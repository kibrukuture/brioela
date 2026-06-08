# Ground — Find Data Model

## What This File Covers

The shared Ground tables, private user find history, freshness/status model, and ownership boundaries.

## Source Specs

- `brioela-specs/35-ground-community-intelligence.md`
- `brioela-specs/35b-ground-finds-deep-design.md`

## Core Entities

### Ground

Ground is the shared local intelligence layer about the physical food environment.

### Find

A Find is one specific, located, fresh, anonymous observation about food in the real world.

It is not a review, post, rating, opinion, feed item, or social contribution.

## Shared Supabase Tables

### `find`

Shared table. User-facing identity is never stored here.

Fields:

- `find_id`
- `location_id`
- `signal_type`
- `content`
- `media_urls`
- `captured_at`
- `expires_at`
- `status`
- `contributor_hash`
- `gate_passed`
- `gate_log`

Allowed `signal_type` values:

- `health`
- `ingredient`
- `price`
- `new_product`
- `general`

Allowed `status` values:

- `active`
- `stale`
- `archived`
- `removed`

### `location_signal_summary`

Shared pre-aggregated table. This is the only table queried for map rendering.

Fields:

- `location_id`
- `signal_type`
- `active_count`
- `last_find_at`
- `updated_at`

Map rendering must not query individual finds for every visible tile.

## Private Brain DO SQLite

### `user_find_history`

Private per-user table in Brain DO SQLite.

Fields:

- `find_id`
- `submitted_at`
- `location_id`
- `signal_type`
- `content_preview`

This is private user history. It does not belong in Supabase.

## Freshness Rules

- Fresh: active, recent, visible with pulse.
- Older than 14 days: stale/faded.
- Older than 60 days: archived from active map.

## Privacy Rules

- Voice audio is never stored.
- Contributor identity is never displayed.
- `contributor_hash` exists only for abuse prevention.
- Media must have EXIF removed.
- Media with faces is blocked.
- Ground data is shared; user find history is private.

## Implementation Notes

- Shared tables live in Supabase.
- Private history lives in Brain DO.
- Stale/archive transitions should run as shared-data maintenance, not per-user DO alarms.
- Supabase scheduled job or a global Worker/QStash job is the better fit for shared Ground aging.
