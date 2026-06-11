# 009 — ID generation method mismatch

## Complaint
The open ledger entries propose using `crypto.randomUUID()` directly to generate version IDs or UUIDs for database rows.

However, the codebase standard is to use the centralized **`createId()`** helper function imported from `@brioela/shared/_ids` to create consistent identifiers.

## What Needs to Happen
All database writes requiring generated unique IDs must use `createId()` instead of `crypto.randomUUID()`.

## Why
Using `crypto.randomUUID()` introduces direct coupling to the crypto module at the database/tool layer, results in inconsistent ID lengths/formats, and violates codebase style checks.

## Status
**OPEN.**
