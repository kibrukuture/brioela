# Bela — Mira Shopper Role

## What This File Covers

Mira in shopper role during active Bela orders.

## Sources

- `implementable-specs/bela/14-shopper-ai-assistant.md`
- `build-guide/08-cooking-session/`

## Stack

Reuse the Mira live presence runtime:

- Cloudflare Realtime / RealtimeKit
- OrderAgent DO for Bela order state and Mira session ownership
- Gemini Live
- JPEG frames via `client_content`
- audio in/out
- proactive reconnect pattern

## Boundaries

- Mira helps the shopper.
- User does not hear the shopper-side Mira session.
- Mira reads only the order constraint snapshot and order context.
- Mira never reveals the user's full private profile.

## Use Cases

- find correct substitute
- explain why item is blocked
- remind shopper about order note
- help interpret unresolved product label
