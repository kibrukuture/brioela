# Scanner — Overview

## What This Folder Covers
The core product loop: point camera at a product, get a verdict in under 3 seconds. Barcode decode (on-device), product resolution (Open Food Facts + gov DBs), constraint check against the user's Orchestrator DO, scan result UI (generative). Also covers OCR fallback when no barcode, boycott filter enforcement, origin/supply chain display, restaurant menu scanning, and receipt scanning. Scanning is always free — never paywalled.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/01-product-health-scanning.md` — scan flow, 3s latency target, verdict structure, API surface
- `brioela-specs/05-origin-supply-chain-and-boycott-filters.md` — boycott rules, origin display, per-user resolution
- `brioela-specs/07-allergy-dislike-and-dietary-guardrails.md` — hard allergy interrupt, soft dislike ranking, dietary identity filter
- `brioela-specs/27-restaurant-menu-scanning.md` — menu photo OCR, per-dish verdict, waiter script generation
- `brioela-specs/19-pricing-and-tiers.md` — scanning is ALWAYS free, unlimited, non-negotiable

## Key Decisions From Specs
- Barcode decode runs on-device (native API) — no network required to extract UPC
- Product resolution: Open Food Facts (3.3M+ products) + country-specific gov DBs selected by user's geo
- Resolved products cached in Upstash Redis with TTL — cache hits return in <500ms
- Constraint check pulls from Orchestrator DO — hard allergies interrupt the normal flow immediately
- Scan verdict: green/yellow/red primary verdict + one-sentence reason + optional expand
- Offline: device caches prior scan results; UPC decode works offline; resolution queued when connectivity returns
- All `scan_event` rows written to Supabase (shared) for recall matching cross-reference
- Menu scan: OCR server-side with contrast enhancement; LLM parses menu into structured dishes; <3s latency

## Tools Built In This Feature
Under `tools/product-scan/`:
- `check-constraint.ts` — check product against user's full constraint profile
- `log-scan-event.ts` — write scan event to Supabase + Orchestrator DO

## What This Folder Depends On
- `05-orchestrator` — constraint profile, user memory, scan history
- `03-foundation` — Supabase for scan_event writes, Upstash Redis for product cache

## What Depends On This Folder
- `08-ground` — find-from-scan flow
- `12-recall-alerts` — recall match against scan_event history
- `22-bela` — constraint enforcement on shopper's scanner
- `13-illness-detective` — scan history is the food window for illness investigation
