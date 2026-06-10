# In-Store Co-Pilot — Session Lifecycle

## What This File Covers

The shop session DO lifecycle.

## Source Specs

- `brioela-specs/45-in-store-copilot.md`
- `brioela-specs/10-mira-cooking-voice.md`

## Session

- Mira session DO named `shop-{userId}-{visitId}`.
- Standard Mira rules: Gemini Live full-duplex audio, `thinkingLevel: minimal`, context injected at connect, mid-session pushes via `send_realtime_input`, inactivity timeout, keepAlive heartbeat during long operations.

## Start Triggers

1. Explicit: one tap from the scanner surface.
2. Ambient: user at a known grocery location (same geo signal Ground's contribution prompt uses) → soft prompt, dismissible, never more than once per visit.

## Mid-Session Events (pushed into the live session)

- every scan result (verdict + constraint matches + price delta + glucose note)
- list check-offs inferred from scans
- running total updates

## End Triggers

- user says they're done
- receipt scan begins (checkout context)
- store geofence exit

## Post-Visit Workflow (Upstash)

Writes: list completion state, bought vs. skipped (dislike signals feed behavioral discovery), price events (inflation tracker), pantry resets (predictive pantry), `shop_visit` record closed and linked to the receipt when it arrives.

## API

- `POST /api/shop/session` — start; returns connection params (spec 10 shape)
- `POST /api/shop/session/events` — mid-session pushes
- `POST /api/shop/session/end` — close + workflow

## Rule

No session, no listening. The microphone activates only inside an explicitly started session.
