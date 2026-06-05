# Wearables — Overview

## What This Folder Covers
Integration with health wearables to enrich food intelligence with actual biometrics rather than population averages. Phase 1: Apple HealthKit (Apple Watch users) and Oura Ring. Phase 2: CGM (Dexcom Stelo, Abbott LibreFreeStyle), Google Health Connect, Whoop, Withings. The CGM integration is the killer feature — personal glucose response to specific foods, correlating scan events with 2-hour glucose windows.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/40-wearables-integration.md` — full wearables spec: device architecture, daily summary shape, memory routing, CGM correlation logic, connection model, privacy rules

## Key Decisions From Specs
- NEVER stream raw sensor data to the DO — client produces one daily summary JSON per device, ~500 bytes
- Client-side aggregation (background task) → daily summary → Orchestrator DO via HTTP on app open
- Memory routing: `health.biometrics`, `health.sleep`, `health.activity`, `health.glucose` namespaces via `memory_update`
- Personality layer: 30+ day sustained patterns only → `user_personality` trait upgrade (not from single day)
- CGM: 2-hour observation window opened on each scan event; 15-min glucose readings during window; derived values (peak, AUC, time-to-peak) stored; raw readings deleted after derivation
- `glucose_meal_window` table in Orchestrator DO SQLite — private, never Supabase
- 3+ CGM correlation events for same product → `spike_trigger` memory fact with confidence
- Disconnect: all `health.*` memory entries sourced from that device deleted on request; derived personality traits flagged for Curator review
- Health data encrypted at rest in DO SQLite — most sensitive data in the entire app

## What This Folder Depends On
- `05-orchestrator` — all wearable data routes to Orchestrator DO memory namespaces
- `06-scanner` — CGM correlation triggered by scan events

## What Depends On This Folder
- `11-pantry-meal-plan` — readiness score affects meal complexity suggestions; pre-workout glucose optimization
- `15-ambient-intelligence` — wearable HRV corroborates wellbeing signals from voice
- `13-illness-detective` — Oura body temperature deviation as early illness signal
