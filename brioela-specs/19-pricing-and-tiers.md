# 19. Pricing and Tiers

## The Non-Negotiable Rule

Unlimited scanning is free forever. No cap. No paywall on scans.

The scan moment is the primary viral feature and the primary acquisition loop. A paywall after 10 scans kills both. Yuka grew to 73 million users because scanning was always free. The scan moment — someone in a grocery store discovering something surprising — must be allowed to happen freely and shared freely. That loop is worth more than any subscription revenue in year one.

## Cost Floor Per User Type

Before pricing anything, the real infrastructure cost per user:

| Usage type | Daily cost | Monthly cost |
|---|---|---|
| Scanner only (no voice) | ~$0.00 | ~$0 |
| Voice cooking, 3×/week, 10 min | ~$0.04 | ~$0.54 |
| Voice cooking, daily, 20 min | ~$0.09 | ~$2.70 |
| Vision + voice, daily, 30 min | ~$1.53 | ~$45.90 |
| Grandma session (4 participants, 45 min) | Cloudflare Realtime/RealtimeKit + Gemini Live | re-check current provider pricing before launch |

Gemini Live and Cloudflare Realtime/RealtimeKit pricing must be rechecked against current provider pricing before launch.

## Tier Structure (from brain dump)

### Free — $0

- Unlimited scanning: always, no cap, non-negotiable.
- Basic map: read-only.
- Community notes: read-only.
- 3 saved recipes.
- Allergy guardrails: yes (safety feature, never gated).
- Boycott filters: yes (user autonomy, never gated).

Upgrade trigger: hits recipe import limit, or tries to start a voice session.

---

### Core — $8/month

Everything in Free, plus:
- Full map with geo-scoped alerts.
- Community notes: write and read.
- Unlimited recipe saves and imports.
- Allergy engine: full behavioral inference and confirmation.
- Personal memory: full (preferences, patterns, behavioral detection).
- Receipt scan: unlimited.
- Weekly food summary.

Upgrade trigger: tries to start a voice cooking session.

---

### Chef — $24/month

Everything in Core, plus:
- AI voice cooking agent: 30 sessions/month (up to 15 min each).
- Spend tracker with healthy vs unhealthy breakdown.
- Generational recipe capture (live family cooking session → permanent recipe).
- Fridge/pantry ingredient rescue.
- Pre-trip food intelligence.

Upgrade trigger: hits voice session limit, or tries to enable live vision.

---

### Power — $55/month

Everything in Chef, plus:
- Unlimited live video cooking (vision + voice, no session cap, no length cap).
- Multi-person cooking rooms (create and host, up to 10 participants).
- Cook Together remote friends feature.
- Priority routing on eu-west-1 (lowest global latency for all AI sessions).
- Advanced behavioral pattern reports.

Pricing rationale: a user cooking every day with vision on costs ~$45.90/month in Gemini Live alone. At $55/month the margin is thin but real, and these users are the most engaged and highest lifetime value.

---

### B2B / Practitioner — $79–99/month

Everything in Power, plus:
- Verified business or practitioner profile (spec 18).
- Practitioner multi-client management (up to 10 client accounts).
- Client food recommendation push.
- Verified map listing with ingredient transparency badge.
- Analytics: scan counts, community note sentiment for their listed products or place.
- Creator public recipe profile (shareable, branded).

## Metered Option (No Subscription)

For users who want occasional access without monthly commitment:
- Voice session: $0.25/session (up to 15 min).
- Vision session: $1.00/session (up to 30 min).
- Multi-person room: $0.50/session (up to 4 participants, 45 min).
- Credits do not expire.

## Tier Gating Rules

- Hard allergy detection and boycott filters: never gated. Safety and user autonomy are free always.
- Basic scan verdict: always free, unlimited. This is the viral entry point and cannot be compromised.
- Voice sessions: first attempted voice session on free tier shows the upgrade prompt inline without leaving the flow.
- Vision sessions: first attempted vision session on Core or Chef tier shows the Chef or Power upgrade prompt.

## Revenue at Month 3 — Worst / Middle / Best Case

**Worst case** (no viral moment, slow organic only):
- Total downloads: 800–1,500
- Paying users: 80–150
- Average revenue per paying user: ~$12/month
- Month 3 revenue: $960–$1,800/month

**Middle case** (one video hits 200k–400k views):
- Downloads: 4,000–8,000
- Paying users: 300–600
- Month 3 revenue: $4,000–$8,000/month

**Best case** (one video hits 1M+ views):
- Downloads: 15,000–40,000
- Paying users: 800–2,500
- Month 3 revenue: $11,000–$35,000/month

Even in the worst case: positive revenue from month 1. The free-to-$8 conversion is driven by natural friction (recipe limit hit, want to write community notes) — not a manipulative paywall.

## Success Metrics

- Free-to-paid conversion rate.
- Tier distribution across the user base.
- Average revenue per paying user.
- Churn rate per tier.
- Day-7 retention (target: above 30%; below 15% means the ambient experience is not landing).
- Upgrade trigger event rate (which features most drive upgrades).
