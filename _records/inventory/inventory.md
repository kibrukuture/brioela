# Master Inventory — All Spec Files

Total: 112 files across 6 areas.

Status markers:
- `[ ]` not yet processed into build-guide
- `[~]` partially processed
- `[x]` fully processed — all build-guide files written, all connections mapped

---

## Area 1 — brioela-specs/ (42 files)

Core product philosophy and feature specs. These are the "what and why" layer.

| Status | File | One-line description |
|---|---|---|
| [~] | `00-product-philosophy-and-ux.md` | Core product philosophy, UX principles — read FIRST before any build-guide |
| [x] | `01-product-health-scanning.md` | Product barcode scanning, health data, constraint check at scan time |
| [~] | `02-recipe-ingestion-from-shared-content.md` | Parsing recipes from shared links, screenshots, social content |
| [x] | `03-hyperlocal-community-notes.md` | **DEPRECATED** — superseded by spec 35 (Ground). Read for context only. |
| [x] | `04-healthy-food-map.md` | Map layer showing healthy food locations — overlays with Ground |
| [x] | `05-origin-supply-chain-and-boycott-filters.md` | Country-of-origin tracking, supply chain, user boycott enforcement |
| [x] | `06-receipt-spend-intelligence.md` | Receipt scanning, spend tracking, price intelligence |
| [x] | `07-allergy-dislike-and-dietary-guardrails.md` | Allergy system, dietary restrictions, hard blocks vs soft guidance |
| [x] | `08-personal-food-memory-engine.md` | User food memory — what they cook, buy, prefer, avoid |
| [x] | `09-per-user-agent-orchestrator.md` | Orchestrator DO — the central agent, CRITICAL PATH for everything |
| [x] | `10-voice-cooking-agent.md` | Voice cooking assistant — precursor to cooking session spec |
| [x] | `11-live-vision-cooking-coach.md` | Camera-based cooking coach — precursor to cooking session spec |
| [~] | `12-multi-person-cooking-rooms.md` | Multiple people in one cooking session |
| [x] | `13-generational-recipe-capture.md` | Capturing family recipes from elders, voice, video |
| [x] | `14-fridge-and-pantry-ingredient-rescue.md` | Pantry state, ingredient rescue, what can I cook with what I have |
| [x] | `15-hyperlocal-price-and-availability-alerts.md` | Real-time price and availability signals near user |
| [x] | `16-weekly-food-summary.md` | Weekly digest of user's food activity |
| [ ] | `17-behavioral-food-pattern-detection.md` | AI detecting patterns in user food behavior |
| [ ] | `18-verified-business-and-practitioner-profiles.md` | Verified profiles for food businesses, dietitians, practitioners |
| [~] | `19-pricing-and-tiers.md` | App pricing tiers, what is free vs paid — CRITICAL for product decisions |
| [ ] | `20-platform-and-app-distribution.md` | iOS, Android, web distribution strategy |
| [x] | `21-onboarding.md` | User onboarding flow — first experience, constraint setup |
| [ ] | `22-pre-trip-food-intelligence.md` | Travel food intelligence — what to eat, buy, avoid in a new city |
| [x] | `23-ambient-notification-strategy.md` | Push notification design, when and how to notify |
| [~] | `24-technical-architecture-backbone.md` | Full technical architecture — CRITICAL, read early |
| [ ] | `25-viral-growth-and-sharing.md` | Viral mechanics, sharing, growth loops |
| [~] | `26-personalized-recall-alerts.md` | Food recall detection, user-specific alert matching |
| [ ] | `27-restaurant-menu-scanning.md` | Scanning restaurant menus, constraint check against menu items |
| [ ] | `28-medical-condition-food-profile.md` | Medical conditions (diabetes, celiac, etc.) mapped to food restrictions |
| [x] | `29-food-cost-inflation-tracker.md` | Tracking price changes over time for user's regular purchases |
| [ ] | `30-food-illness-detective.md` | Detecting potential food illness from user's recent consumption |
| [ ] | `31-kids-food-literacy-mode.md` | Kids mode — age-appropriate food education |
| [x] | `32-grandma-style-flavor-profile.md` | Capturing and recreating traditional/family flavor profiles |
| [x] | `33-minimum-spend-meal-plan.md` | Budget meal planning — most nutrition for least cost |
| [x] | `34-universal-visual-intake.md` | Visual food logging — photo → nutrition data |
| [x] | `35-ground-community-intelligence.md` | Ground system — community food intelligence layer |
| [x] | `35b-ground-finds-deep-design.md` | Ground deep design — UX, pulse animation, haptic discovery, find flow |
| [x] | `36-predictive-pantry-intelligence.md` | Predicting what user will run out of before they do |
| [ ] | `37-guest-and-cooking-for-others.md` | Cooking for guests, dietary handling for multiple people |
| [ ] | `38-food-time-machine.md` | Historical food data — what did I eat this time last year |
| [~] | `39-generative-ui.md` | Generative UI spec — CRITICAL for design system build |
| [ ] | `40-wearables-integration.md` | Apple Watch, wearable integration |
| [ ] | `README.md` | Spec folder overview |

---

## Area 2 — implementable-specs/ root (18 files)

Orchestrator DO SQLite schema and memory system — the data layer everything runs on.

| Status | File | One-line description |
|---|---|---|
| [x] | `00-overview.md` | Implementable specs overview |
| [x] | `01-memory-event.md` | Memory event schema — how events are logged |
| [x] | `02-user-memory.md` | User memory table — key/value memory store |
| [x] | `03-user-personality.md` | User personality model — how the AI understands the user |
| [x] | `04-skills.md` | User cooking skills table |
| [x] | `05-skill-versions.md` | Skill versioning — how skills evolve over time |
| [x] | `06-constraints.md` | Constraint table — allergies, dietary rules, boycotts |
| [x] | `07-sessions.md` | Session table — cooking sessions, scan sessions |
| [x] | `08-session-turns.md` | Session turns — each exchange in a session |
| [x] | `09-recipes.md` | Recipe table — user's saved recipes |
| [x] | `10-scheduled-alarms.md` | DO alarm schedule — timer system |
| [x] | `11-agent-state.md` | Agent state key/value store in DO SQLite |
| [x] | `12-schema-version.md` | Schema migration versioning |
| [~] | `13-gaps-and-missing-specs.md` | Known gaps — read to understand what is intentionally unspecced |
| [x] | `15-curator.md` | Curator — background maintenance job (note: no file 14) |
| [x] | `16-agent-identity.md` | Agent identity — who Brioela is, how it presents itself |
| [x] | `17-session-lifecycle.md` | Full session lifecycle from open to close |
| [x] | `18-vectorize.md` | Cloudflare Vectorize integration — semantic search |

---

## Area 3 — implementable-specs/brioela-tools/ (19 files)

Every tool the AI agent can call — the full tool protocol.

| Status | File | One-line description |
|---|---|---|
| [x] | `00-index.md` | Tool index — all tools listed |
| [x] | `01-log-memory-event.md` | Tool: log a memory event |
| [x] | `02-write-user-memory.md` | Tool: write to user memory |
| [x] | `03-read-user-memory.md` | Tool: read from user memory |
| [x] | `04-create-user-skill.md` | Tool: create a new skill record |
| [x] | `05-update-user-skill.md` | Tool: update an existing skill |
| [x] | `06-view-user-skill.md` | Tool: read a skill |
| [x] | `07-archive-user-skill.md` | Tool: archive (soft-delete) a skill |
| [x] | `08-delete-user-skill.md` | Tool: hard-delete a skill |
| [x] | `09-propose-user-constraint.md` | Tool: AI proposes a new dietary constraint |
| [x] | `10-confirm-user-constraint.md` | Tool: user confirms a proposed constraint |
| [x] | `11-schedule-user-alarm.md` | Tool: set a cooking timer via DO alarm |
| [x] | `12-cancel-user-alarm.md` | Tool: cancel a timer |
| [x] | `13-view-user-recipe.md` | Tool: read a recipe |
| [x] | `14-update-user-recipe.md` | Tool: update a recipe |
| [x] | `15-archive-user-recipe.md` | Tool: archive a recipe |
| [x] | `16-load-session-context.md` | Tool: load full user context at session start |
| [x] | `17-search-session-history.md` | Tool: search past sessions |
| [x] | `18-search-web.md` | Tool: web search from within a session |

---

## Area 4 — implementable-specs/cooking-session/ (17 files)

Full cooking session implementation — CookingAgent DO, Gemini Live, audio/video pipeline.

| Status | File | One-line description |
|---|---|---|
| [x] | `00-overview.md` | Cooking session system overview |
| [x] | `01-room-lifecycle.md` | Room creation, joining, leaving — Cloudflare Realtime SFU |
| [x] | `02-cooking-agent.md` | CookingAgent DO — main controller, in-memory state, endpoints |
| [x] | `03-gemini-session.md` | Gemini 3.1 Flash Live WebSocket — setup, audio, video, tool calls |
| [x] | `04-tool-protocol.md` | How Gemini tool calls are handled and forwarded |
| [x] | `05-video-processing.md` | JPEG frame pipeline — mobile → SFU → DO → Gemini |
| [x] | `06-timers.md` | Cooking timer system via DO alarms |
| [x] | `07-transcript-storage.md` | Session transcript written to SQLite |
| [x] | `08-session-end.md` | Clean session end, state flush, memory writes |
| [x] | `09-reconnection.md` | Gemini reconnect logic, DO eviction recovery |
| [x] | `10-human-behaviors.md` | Human-like AI behaviors — tone, hesitation, proactive observations |
| [x] | `proactive-speech-engine/00-index.md` | Proactive speech engine overview |
| [x] | `proactive-speech-engine/01-silence-tracker.md` | Tracks silence duration to decide when AI can speak |
| [x] | `proactive-speech-engine/02-visual-change-detector.md` | Detects visual changes in camera feed |
| [x] | `proactive-speech-engine/03-adaptive-frequency.md` | Adjusts how often AI speaks based on session context |
| [x] | `proactive-speech-engine/04-prompt-builder.md` | Builds observation prompts sent to Gemini |
| [x] | `proactive-speech-engine/05-response-filter.md` | Filters Gemini responses — suppresses "ok", passes real observations |
| [x] | `proactive-speech-engine/06-suppression-rules.md` | Rules for when AI must not speak |

---

## Area 5 — implementable-specs/bela/ (16 files)

Full Bela grocery delivery implementation.

| Status | File | One-line description |
|---|---|---|
| [x] | `00-overview.md` | Bela system overview — updated this session |
| [x] | `01-order-creation.md` | AI list generation, user approval, delivery window |
| [x] | `02-shopper-platform.md` | Shopper onboarding, KYC, Stripe Connect, Bela card — updated this session |
| [x] | `03-constraint-travel.md` | Constraint profile enforcement on shopper's scanner |
| [x] | `04-live-scan-session.md` | Real-time scan sharing between shopper and user |
| [x] | `05-escrow-payment.md` | Payment intent escrow, capture, Connect payout — full rewrite this session |
| [x] | `06-shopper-quality.md` | Scan accuracy score, trust relationship, suspension |
| [x] | `07-ground-contribution.md` | Shoppers contributing Ground finds as side effect of orders |
| [x] | `08-smart-routing.md` | Ground + product_sighting multi-store route planning |
| [x] | `09-standing-order.md` | Weekly pantry replenishment — zero management |
| [x] | `10-cooking-intent-trigger.md` | Cooking session → grocery order trigger |
| [x] | `11-for-others.md` | Ordering for grandparents, family, non-users |
| [x] | `12-dispute-resolution.md` | Wrong/missing items, photo proof, auto-refunds |
| [x] | `13-data-model.md` | All SQL tables for the shopping system |
| [x] | `14-shopper-ai-assistant.md` | Voice + vision AI for shopper — Gemini Live, same stack as cooking session |
| [x] | `15-checkout-payment.md` | Dedicated Bela card, receipt scan, door scan — full rewrite this session |

---

## Priority Read Order for Build-Guide

When starting the inventory reading pass, read in this order — highest impact first:

1. `brioela-specs/00-product-philosophy-and-ux.md` — sets everything
2. `brioela-specs/24-technical-architecture-backbone.md` — foundation decisions
3. `brioela-specs/09-per-user-agent-orchestrator.md` — critical path
4. `brioela-specs/39-generative-ui.md` — needed before any design-system files
5. `brioela-specs/19-pricing-and-tiers.md` — affects product decisions throughout
6. `implementable-specs/00-overview.md` through `18-vectorize.md` — Orchestrator DO data layer
7. `implementable-specs/brioela-tools/` — full tool protocol
8. `implementable-specs/cooking-session/` — full cooking session
9. `brioela-specs/35-ground-community-intelligence.md` + `35b-ground-finds-deep-design.md`
10. `implementable-specs/bela/` — full Bela stack
11. Remaining brioela-specs in numerical order
