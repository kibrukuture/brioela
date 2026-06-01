# 09. Per-User Agent Orchestrator

## Goal

Give each Brioela user a fully isolated, self-contained, event-driven agent that owns their private food memory, enforces their personal constraints, and coordinates all personalized behavior across the entire product.

## The Hermes Architecture Principle

Each user's agent is a complete, independent brain. It is not a shared pool. It is not a generic routing layer. It is one agent per user, permanently assigned to that user, never shared with any other user.

This is the Hermes model of agent design: total isolation, full ownership, self-contained tooling and memory. The agent knows this user's history, preferences, allergies, patterns, and context. It cannot see any other user's data. It cannot be borrowed by another user's request. When it wakes up for a user, it already knows who they are.

This is implemented using the Cloudflare Agent SDK (`agents` npm package), which builds on Cloudflare Durable Objects and provides structured state management, SQLite storage, RPC methods, WebSocket support, and self-scheduling.

## Two DO Roles Per User

### Orchestrator DO (Permanent Brain)
- Always exists for every registered user.
- Holds the user's private SQLite database.
- Stores: scan history, resolved preferences, confirmed dislikes, hard allergies, dietary identity, recipe library references, spend patterns, sickness events, behavioral patterns, travel context.
- Receives all product-feature events.
- Is the source of truth for context injection into any live session.
- Hibernates when idle — near-zero cost when not active.

### CookingAgent DO (Live Session Brain)
- Spawned per cooking session.
- Holds: current recipe, step index, active participant list, live transcript accumulation, in-session inferences.
- Pulls user memory from the Orchestrator DO at session start to seed context.
- Sends transcript events to the Orchestrator DO as the session progresses.
- On session end, fires a summarization job to Upstash Workflow which writes durable facts back to the Orchestrator DO.
- Destroyed after session close and summarization.

## Event Types the Orchestrator DO Receives

- Product scanned (with product_id, geo_hash, verdict, match results).
- Recipe imported (recipe_id, source, confidence level).
- Receipt ingested (merchant, line items, total).
- Cooking session started (session_id, recipe_id).
- Cooking session ended (session_id, transcript summary).
- Community note posted or flagged.
- Constraint confirmed by user (explicit allergy or dislike declaration).
- Constraint proposed (behavioral inference candidate awaiting confirmation).
- Sickness event logged.
- Travel intent detected (destination, date).
- Weekly summary generation trigger (from self-scheduled task or Upstash QStash).

## Agent Tool Set

The Orchestrator DO agent has access to the following callable tools:

- `read_memory(domain, key)` — retrieve a specific fact from personal SQLite.
- `write_memory(domain, key, value, confidence)` — store or update a fact.
- `propose_constraint(type, value, evidence)` — generate a constraint candidate for user confirmation.
- `confirm_constraint(constraint_id)` — mark a proposed constraint as confirmed.
- `schedule_job(type, payload, delay)` — push a job to Upstash QStash for async execution.
- `generate_summary(period)` — trigger the weekly summary workflow via Upstash Workflow.
- `get_session_context(session_id)` — build the full context payload for a cooking session.
- `record_outcome(event_type, entity_id, notes)` — log a negative or positive outcome event.
- `flag_location(place_id, reason)` — permanently mark a place as avoided for this user.

## Context Injection into Sessions

When a cooking session starts, the Orchestrator DO builds a context payload containing:
- User name and preference summary.
- Hard allergies (full ingredient list, trace detection required).
- Active dislikes and dietary identity.
- Current recipe with step list.
- Any prior notes about this recipe or its ingredients.
- Behavioral patterns relevant to the current moment.
- Recent negative outcomes.

This payload is injected into the Gemini Live session as system instructions at connect time. Changes during the session (new step, allergy match detected, product scan result arriving mid-cook) are pushed into the live session via `send_realtime_input` text injection from the CookingAgent DO.

## Execution Model

- **Fast path**: scan scoring personalization, allergy guardrail checks, recipe reranking — execute inline as synchronous RPC into the Orchestrator DO from the Worker.
- **Async path**: recipe import processing, receipt OCR, pattern detection runs, weekly summary generation — dispatched to Upstash QStash and executed via Upstash Workflow.
- **Self-scheduled tasks**: the Orchestrator DO can schedule its own future executions (e.g., weekly summary trigger) using the Agent SDK's scheduling interface.
- **Idle behavior**: agent hibernates between events. Cloudflare handles wake-on-request automatically.

## Upstash Integration

- **QStash**: used to publish async events from the Orchestrator DO to background workers. Examples: `recipe.import`, `receipt.process`, `pattern.analyze`, `summary.generate`. QStash guarantees delivery and retries on failure.
- **Workflow**: multi-step durable jobs that must survive partial failure. Recipe import (6 steps), receipt parsing (5 steps), session summarization (4 steps) all run as Upstash Workflows. The Workflow writes final results back to the Orchestrator DO via a signed Cloudflare Worker callback.
- **Redis**: Orchestrator DO reads product cache from Upstash Redis before calling external product databases. Also reads rate-limit counters maintained by the Worker layer.

## Data Boundaries

- **Per-user Orchestrator DO**: personal memory, derived facts, pending alerts, scheduled tasks. Only accessible by the owning user's authenticated requests.
- **CookingAgent DO**: ephemeral session state. No persistence after session close.
- **Shared systems**: product corpus, community notes, map entities, business profiles — readable from Workers, never stored in per-user DO.

## API Surface

- `POST /api/agent/events` — receive a product event from any Brioela feature, route to the correct Orchestrator DO via RPC.
- `GET /api/agent/context` — return a user's current memory context for use in external session initialization.
- Internal DO-to-DO RPC: CookingAgent DO calls Orchestrator DO for context and emits events back.

## Non-Functional Requirements

- Complete isolation between users. No shared mutable state.
- Near-zero idle cost. DO hibernation is the default state.
- Sub-100ms wake latency for inline requests.
- User account deletion must delete all Orchestrator DO SQLite data without requiring a database JOIN across shared tables.
- Personal memory must never be visible to Cloudflare or Brioela staff through normal application paths — it lives inside the DO's storage, not in a queryable shared database.

## Success Metrics

- Agent wake and response latency for inline (fast path) requests.
- Event processing success rate.
- Async job delivery and completion rate via QStash.
- Memory fact accumulation over user lifetime (proxy for personalization depth).
- Proportion of features reading from memory per active user (proxy for system integration health).
