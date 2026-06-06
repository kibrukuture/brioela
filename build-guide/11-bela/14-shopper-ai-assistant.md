# Bela — Shopper AI Assistant

## What This File Covers

Voice/vision assistant for shoppers during active orders.

## Sources

- `implementable-specs/bela/14-shopper-ai-assistant.md`
- `build-guide/08-cooking-session/`

## Stack

Reuse the cooking-session stack:

- Cloudflare Realtime / RealtimeKit
- OrderAgent DO
- Gemini Live
- JPEG frames via `client_content`
- audio in/out
- proactive reconnect pattern

## Boundaries

- Shopper AI helps shopper.
- User does not hear shopper AI.
- Shopper AI reads only order constraint snapshot and order context.
- Shopper AI never reveals private full user profile.

## Use Cases

- find correct substitute
- explain why item is blocked
- remind shopper about order note
- help interpret unresolved product label
