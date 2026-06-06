# Bela — Live Scan Session

## What This File Covers

OrderAgent live scan relay between shopper and user.

## Sources

- `implementable-specs/bela/04-live-scan-session.md`
- `build-guide/07-scanner/`

## Core Rule

This is data sync, not a video call.

## OrderAgent Responsibilities

- shopper WebSocket
- user WebSocket
- product resolution
- constraint check
- scan result broadcast
- event logging

## Shopper Sees

- item target
- scan result
- block/warn/pass
- substitution suggestions

## User Can

- watch passively
- reject category matches
- approve substitutions
- send notes
- override only their own constraints

## Always Log

Every scan event must be logged even if user is not watching.
