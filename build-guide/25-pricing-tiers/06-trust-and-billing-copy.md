# Pricing Tiers — Trust And Billing Copy

## What This File Covers

Pricing-page trust copy, billing states, annual discount, cancellation behavior, and tone rules.

---

## Trust Copy

Use this on the pricing page:

```text
We do not run ads.
We do not sell your food life.
We do not turn your health data into targeting.

Brioela is paid for by the people who want it to go deeper.
```

This is not optional. Pricing needs to explain why paying matters.

---

## Monthly / Yearly

Offer monthly and yearly.

Yearly discount from inspiration/spec direction:

```text
Yearly — save 20%
```

Do not make annual the only obvious choice. Make it clear but not manipulative.

---

## Billing States

```typescript
type BillingState =
  | "free"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
```

UI behavior:

- `past_due`: gentle update payment prompt
- `cancelled`: access remains until period end
- `expired`: downgrade to Sapor, preserve data
- `trialing`: show trial end date clearly

---

## Cancellation Copy

Use:

```text
Your Brioela memory stays yours. Cancelling stops paid features after the current period, but your private data is not deleted.
```

Avoid:

```text
You will lose everything.
```

---

## Tone Rules

Pricing copy should not sound like enterprise SaaS.

Avoid:

- unlock productivity
- maximize engagement
- upgrade your workflow
- premium AI power
- supercharge your nutrition stack

Use:

- go deeper
- your private food memory
- cook beside you
- for everyone at your table
- verified tools for people and food businesses

---

## Safety Copy

Always include:

```text
Every Brioela plan includes unlimited basic product scans.
Food safety, hard allergy guardrails, and boycott filters are never paywalled.
```

Do not bury this in FAQs. It is a core trust promise.
