# Tonight — Timing and Delivery

## What This File Covers

When and how the card arrives.

## Source Specs

- `brioela-specs/51-tonight-dinner-answer.md`
- `brioela-specs/23-ambient-notification-strategy.md`

## Learned Timing

- Cold start: a sensible late-afternoon default window (local time). In-app card only — **no push at all for the first two weeks**.
- Learning signals: actual cooking session start times, recipe opens, historical fridge-scan moments. The delivery time converges toward ~45–90 minutes before the user's real decision moment.
- The cooking meal itself is learned too: a user whose history shows lunch is their cooking meal gets Tonight at lunch decision time. One answer per day is the fixed principle; the hour is not.

## Delivery Rules

- The push (when earned) competes for the standard one-medium-priority-per-day slot. On a day a price alert mattered more, Tonight is in-app only.
- Quiet hours, active-session suppression: unchanged, inherited.
- One card, once. No re-prompts, no "you didn't cook yesterday" nudges, nothing after dismissal until tomorrow.

## The Card

- Generative-grammar surface: a low-energy Tuesday card and a Saturday cook-up card should feel different. Static base renders first as always.
- Headline: dish + time + the inventory claim ("Everything's in your kitchen").
- Sub-line only when a real signal earned it: "Kept it easy — looks like a low-energy day." / "Works for everyone eating tonight." / "Uses the spinach before it turns." Never names a metric.
- Three responses, one gesture each: Cook it / Swap / Not tonight.

## Rule

No configuration surface exists. No "set your dinner time," no cuisine pickers. Everything is learned or already known.
