# 19. Pricing and Tiers

## Goal

Define a tier structure for Brioela that covers the full spectrum of users from casual food scanners to daily power cookers, recovers real infrastructure costs, and creates clear upgrade moments tied to features people already want.

## Cost Floor (Infrastructure Per Active User)

Before setting prices, the cost floor per user type must be understood:

| Usage type | Daily AI cost | Monthly AI cost |
|---|---|---|
| Scanner only (no voice) | ~$0.00 (product DB lookup) | ~$0 |
| Voice cooking, 3×/week, 10 min/session | ~$0.04 | ~$0.54 |
| Voice cooking, daily, 20 min/session | ~$0.09 | ~$2.70 |
| Vision + voice, daily, 30 min/session | ~$1.53 | ~$45.90 |
| Grandma session (4 participants, 45 min, vision) | $0.09 LiveKit + ~$2.30 Gemini | one-off ~$2.40 |

Gemini Live audio-only: ~$0.0045/min. Gemini Live audio + video: ~$0.051/min. LiveKit Cloud: $0.0005/min per participant.

## Tier Structure

### Free Tier

Target: curious first-time users, students, casual shoppers.

- Product scanning: unlimited scans.
- Health verdict (green/yellow/red): yes.
- Community notes: read only.
- Healthy food map: read only, limited radius.
- Recipe save from TikTok/YouTube: 5 imports/month.
- Voice cooking agent: no.
- Live vision: no.
- Multi-person rooms: no.
- Weekly food summary: no.
- Personal memory: basic (scan history only, no behavioral patterns).
- Boycott filters: yes (full feature, no compute cost).
- Receipt scan: 2/month.

Upgrade trigger: hits recipe import limit, or tries to start a voice session.

---

### Core Tier — ~$7/month

Target: health-conscious regular users who cook a few times a week.

Everything in Free, plus:
- Recipe imports: unlimited.
- Community notes: write and read.
- Map: full radius, price alerts.
- Receipt scan: unlimited.
- Weekly food summary: yes.
- Voice cooking agent: yes, 20 sessions/month (up to 15 min each).
- Live vision: no.
- Multi-person rooms: listen-only (can join but not create).
- Personal memory: full (preferences, patterns, behavioral detection).
- Allergy and dislike inference: yes.

Upgrade trigger: hits voice session limit, or tries to create a multi-person room.

---

### Family Tier — ~$15/month

Target: households, regular cooks, family cooking sessions.

Everything in Core, plus:
- Voice cooking: unlimited sessions, up to 30 min each.
- Multi-person rooms: create and host rooms (up to 4 participants).
- Generational recipe capture: yes.
- Live vision: yes, 5 sessions/month (up to 30 min each).
- Pre-trip food intelligence: yes.
- Fridge/pantry ingredient rescue: yes.
- Up to 2 user profiles per subscription (family member sharing).

Upgrade trigger: wants unlimited vision, or hits participant cap.

---

### Power Tier — ~$49/month

Target: daily power cooks, serious home chefs, nutritionists using personally.

Everything in Family, plus:
- Voice cooking: unlimited, no session length cap.
- Live vision: unlimited sessions.
- Multi-person rooms: up to 10 participants, unlimited sessions.
- Cook Together (remote friends): full feature.
- Priority AI response (Gemini Live `thinkingLevel` raised to `low` as default).
- Advanced behavioral pattern reports.
- Full spend intelligence with budget optimization.

This tier prices above the cost floor for a user cooking every day with vision on (~$45.90/month cost). Margin is intentionally thin at this level — these users are the most loyal and generate the most memory data.

---

### B2B / Practitioner Tier — ~$79–99/month

Target: nutritionists, dietitians, health food creators, verified restaurants.

Everything in Power, plus:
- Practitioner profile (spec 18).
- Multi-client management (up to 10 client accounts).
- Client food recommendation push.
- Verified map listing.
- Ingredient transparency badge on map.
- Analytics: scan counts, community note sentiment for their products/place.
- Creator public recipe profile (shareable, branded).

## Tier Gating Rules

- Hard allergies and boycott filters are never gated. These are safety and user autonomy features — gating them would be wrong.
- Basic product scan (verdict only) is always free. This is the viral entry point.
- Voice sessions are the primary upgrade lever. The first time a free user tries to start a voice session, the upgrade prompt appears inline without leaving the flow.
- Vision sessions are the secondary upgrade lever. First vision attempt upsells Family tier.

## Metered Option (Alternative to Upgrade)

Users who do not want a subscription can purchase session credits:
- Voice session: $0.25/session (up to 15 min).
- Vision session: $1.00/session (up to 30 min).
- Multi-person room: $0.50/session (up to 4 participants, 45 min).

Credits do not expire. This serves occasional-use users who don't want monthly commitment.

## Revenue Logic

At Core tier ($7/month), margin is high — the per-user cost for 20 voice sessions at ~$0.54/month total AI cost leaves ~$6.46 gross margin per user. At Power tier ($49/month), the margin depends on actual usage — a user who cooks with vision every day approaches the cost floor. The tier pricing reflects this.

B2B tier is where the highest margin lives — practitioners don't use voice sessions daily, so the cost floor is low while the value (managing client accounts, verified listing) is high.

## Success Metrics

- Free-to-paid conversion rate.
- Tier distribution across the user base.
- Average revenue per paying user.
- Churn rate per tier.
- Upgrade trigger event rate (which features most drive upgrades).
