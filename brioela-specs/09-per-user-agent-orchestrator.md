# 09. Per-User Agent Orchestrator

## Goal
Give each Brioela user a lightweight, isolated, event-driven agent that owns their private food memory and coordinates personalized feature behavior.

## Core Responsibility
- Receive user events.
- Update personal memory.
- Execute quick synchronous decisions.
- Trigger longer workflows when needed.

## Architecture
- Cloudflare Worker acts as stateless front door.
- One Durable Object or Agent instance per user acts as the orchestrator.
- Shared databases hold global data such as products, places, and community notes.
- Per-user agent holds private state and user-specific SQLite.

## Event Types
- Product scanned.
- Recipe imported.
- Receipt ingested.
- Cooking session started or ended.
- Community note interaction.
- Periodic self-scheduled summary generation.

## Data Boundaries
- Per-user agent: personal memory, derived facts, pending user-specific alerts.
- Shared systems: public product corpus, map entities, community content.

## Execution Model
- Fast path: scan scoring and simple personalization execute inline.
- Async path: multi-step jobs dispatch to a workflow system.
- Agent hibernates when idle.

## API Surface
- `POST /api/agent/events`
- Internal RPC from Worker to per-user agent.

## Non-Functional Requirements
- Isolation between users.
- Near-zero idle cost.
- Low-latency wake and response.
- Clear boundary between private and shared data.

## Success Metrics
- Agent wake latency.
- Event processing success rate.
- Personalization cache hit rate.
