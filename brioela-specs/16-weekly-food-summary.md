# 16. Weekly Food Summary

## Goal
Generate a concise, ambient summary of the user's recent food behavior without requiring them to open dashboards or manually log activity.

## User Outcome
- Receive a short weekly summary.
- Understand broad patterns in eating, spending, and product quality.
- Get one or two actionable suggestions, not a report dump.

## In Scope
- Weekly rollup generation.
- Pattern extraction across scans, receipts, recipes, and sessions.
- Lightweight push or in-app delivery.

## Out of Scope
- Daily detailed nutrition reports.
- Medical-grade health advice.

## Data Sources
- Scan events.
- Receipt spend.
- Recipe activity.
- Constraint matches.
- Community interactions.

## Output Structure
- One-line summary.
- Two to four key observations.
- Optional one action recommendation.

## Data Model
- `weekly_summary`: user_id, week_start, summary_json, generated_at, delivered_at.

## Technical Notes
- Summary generation should be scheduled by the per-user agent or workflow layer.
- Summaries must avoid overconfident causal language.

## Success Metrics
- Summary open rate.
- Return-to-app rate after summary delivery.
- User feedback score on relevance.
