# Health Intelligence — Overview

## What This Folder Covers

Medication tracking, medication reminders via AI voice call, the Health Agent (weekly per-user background agent), and anonymized community health contribution. This is the system that makes Brioela a genuine health intelligence platform — not just a food scanner.

## Status
[x] complete — five files written; needs final implementation proof before coding

## Files In This Folder

| File | Contents |
|---|---|
| `01-medication-tracking.md` | Private SQLite tables: medications, health_events, and one generic health_captures table (measurements + labs + prescriptions + documents) — photo/voice extraction, medication-food interaction check at scan time |
| `02-medication-reminders.md` | AI voice call via Vapi/Bland AI as primary reminder, OneSignal push as fallback, call flow, webhook response logging, DO alarm scheduling |
| `03-health-agent.md` | Weekly per-user Health Agent DO — reads private health data, detects food-health correlations, runs k-anonymity check, writes anonymized signals to community Postgres tables |
| `04-community-health-tables.md` | Full schema for 8 anonymized community Postgres tables — anonymous_health_groups, anonymous_exposure_event_associations, anonymous_ingredient_event_association_index, product_community_health_summary, anonymous_medication_food_event_associations, anonymous_time_of_day_event_patterns, anonymous_region_event_patterns, anonymous_research_association_candidates |

## Specs This Folder Draws From

- `brioela-specs/28-medical-condition-food-profile.md` — medical conditions mapped to food restrictions
- `brioela-specs/40-wearables-integration.md` — CGM, Apple Health, Oura Ring — biometric data sources
- `build-guide/07-scanner/07-community-product-intelligence.md` — scanner-facing community table behavior; `04-community-health-tables.md` is the schema source of truth
- `build-guide/07-scanner/03-constraint-check.md` — medication-food interaction check that reads medication data

## Key Decisions

- **Medication data is private forever.** All medication, health event, and health-capture data lives in Orchestrator DO SQLite. It never goes to Supabase in identifiable form. Only explicitly opted-in anonymized aggregate signals leave the DO.
- **One generic `health_captures` table, not per-type tables.** Every measurement, lab result, prescription, and document is one append-only row with the value in `value_json`. No schema change for a new metric or document type. Replaces the earlier `biometric_readings` + `medical_documents` split.
- **No `medication_reminders` table.** A reminder is a `scheduled_alarms` row; the call outcome lands on that row via the generic `action_outcome_status` + `action_outcome_json` columns. One generic action-outcome surface serves every alarm type.
- **AI voice call (Vapi/Bland AI) for critical reminders.** Not a push notification — an actual phone call from an AI agent. Used sparingly: medication reminders with confirmed high-stakes drugs (anticoagulants, insulin, critical medications). Fallback: OneSignal push.
- **k-anonymity = 100.** The Health Agent will not write any anonymized signal to community Postgres unless the anonymous health group has at least 100 members and the user has opted into health contribution. Below that threshold: no contribution, data stays private.
- **Correlations are surfaced, never turned into clinical conclusions.** Brioela is not a medical device. It finds patterns ("you often feel tired after eating this category of food"). It does not diagnose, treat, or prescribe. The plain-language association summaries in `anonymous_research_association_candidates` reflect this.
- **Health Agent is Orchestrator-owned.** Started by the Orchestrator from a `scheduled_alarms` row, runs a bounded pass, proposes/records results through Orchestrator-owned capabilities, and never owns user SQLite truth.

## What This Folder Depends On

- `05-orchestrator` — Orchestrator DO alarms (incl. `scheduled_alarms.action_outcome_status`/`action_outcome_json`), agent_state, sub-agent/capability hardening
- `06-memory-engine` — health_events, medications, health_captures tables in DO SQLite
- `07-scanner/07-community-product-intelligence.md` — community Postgres tables
- `20-wearables` — biometric data ingestion into health_captures

## What Depends On This Folder

- `07-scanner/03-constraint-check.md` — medication-food interaction check reads the private `medications` table; user_memory only mirrors summary context
- `07-scanner/07-community-product-intelligence.md` — Health Agent and scheduled aggregate jobs write the community Postgres tables
- `16-illness-detective` — illness detective now also cross-references health_events table alongside memory_event
- Any future AI research partnership — anonymous_research_association_candidates is the export surface
