# 07 - Camera Permission Flow

## Problem

A system permission popup can destroy the cinematic spell.

## Principle

The camera reveal should feel inevitable, not interrupted.

## Options

### Option A - Ask Before Cinematic

Use a soft pre-permission screen before the film.

Pros:
- camera can be ready under the final scene
- clean reveal

Cons:
- user sees permission before emotional context

### Option B - Cinematic First, Permission After

Let the film end at a soft camera gate.

Pros:
- emotional spell stays intact

Cons:
- final camera reveal cannot be real unless permission already exists

### Option C - Hybrid

If permission exists, reveal real camera.

If not, reveal a beautiful soft camera-intent screen that asks permission in Brioela voice.

This is probably the safest first production path.

## Open Decision

Choose permission flow before implementation.
