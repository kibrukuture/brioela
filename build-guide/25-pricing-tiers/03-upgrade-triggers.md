# Pricing Tiers — Upgrade Triggers

## What This File Covers

When upgrade prompts appear, how they are worded, and what never triggers a paywall.

---

## Core Rule

Upgrade prompts appear at the moment of desire, never before the user receives basic value.

No install paywall. No first-scan paywall. No safety paywall.

---

## Never Trigger Upgrade

Do not show an upgrade prompt for:

- first product scan
- hard allergy alert
- boycott alert
- basic verdict
- basic confidence caveat
- recall/safety warnings
- user trying to view why a safety warning appeared

---

## Trigger Examples

Recipe import/save limit:

```text
You can keep this recipe in Brioela with Luma.
```

Menu scanning:

```text
Turn the whole menu into choices that fit you with Luma.
```

Kids Mode:

```text
Explain this in a way a child can understand with Luma.
```

Voice cooking:

```text
Cook this with Brioela beside you in Culina.
```

Live video cooking:

```text
Let Brioela see what you see with Viva.
```

Mesa:

```text
See what works for everyone at your table with Mesa.
```

Signet:

```text
Bring verified food guidance into Brioela with Signet.
```

---

## Prompt Behavior

Rules:

- inline, not a full-screen interruption when possible
- one sentence of value
- one action
- dismissible
- never shames free users
- never says "unlock safety"
- never leaves the flow unless the user chooses upgrade

---

## First Three Scans Rule

Spec says upgrade prompt should never appear on first 3 scans.

Implementation:

```typescript
type UpgradePromptEligibility = {
  scanCount: number
  hasReceivedCoreValue: boolean
  promptSuppressedUntil: number | null
}
```

If `scanCount < 3`, suppress non-critical upgrade prompts from scan surfaces.

---

## Dismissal Suppression

If user dismisses same upgrade family repeatedly:
- 2 dismissals → suppress for 14 days
- 3 dismissals → suppress until user manually opens pricing/settings or tries a hard entitlement again

Do not nag.
