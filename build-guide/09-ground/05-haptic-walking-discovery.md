# Ground — Haptic Walking Discovery

## What This File Covers

Optional second-release background haptic discovery for nearby relevant Finds.

## Source Specs

- `brioela-specs/35b-ground-finds-deep-design.md`
- `brioela-specs/23-ambient-notification-strategy.md`

## Status

Second-release feature. Not required for basic Ground.

## Mechanism

When enabled, the app checks nearby cached `location_signal_summary` data while the user is walking.

Trigger if:

- fresh find within 150m
- find age under 4 hours
- relevance score above threshold
- user is walking, not driving
- user has not visited the place recently

Output:

- one slow haptic pulse
- no sound
- no lock-screen notification
- no repeated nagging

## Privacy Rule

Check should run on-device from cached nearby summaries when possible.

No continuous location trail is stored.

Opening the app can then fetch full Find detail.

## Suppression

- no haptic during active cooking session
- no repeat within 20 minutes
- reduce to once daily if ignored repeatedly
- suppress signal types user never acts on
