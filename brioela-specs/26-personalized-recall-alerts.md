# 26. Personalized Recall Alerts

## Goal

Match every active FDA and global food safety recall against the user's personal scan history and notify them — by name, by batch, by exact product — the moment a recall is issued for something they actually bought.

## Why This Exists

The FDA issues 300+ food recalls per year. The average person finds out about a recall when they're already sick, or never at all. Generic recall notifications exist but they're useless — they name a product and a lot number and leave the user to figure out if it applies to them.

Brioela has the user's full scan history. The match is automatic. The notification is personal: "The exact batch of [product] you scanned on May 14th has been recalled for Listeria contamination. Check your fridge now."

No other app does this because no other app has the scan history to match against.

## User Outcome

- User scans products normally. No recall-specific setup.
- When a recall is issued, Brioela silently cross-references every active recall against the user's scan history.
- If there is a match: push notification, critical priority, immediate. "You may have this at home."
- If no match: user never hears about it. No generic recall spam.
- The notification links to the full recall notice and tells the user exactly what to do (return to store, discard, do not eat).

## Data Sources

- **FDA Recalls, Market Withdrawals & Safety Alerts**: public API, updated continuously, covers all FDA-regulated food products in the US.
- **EFSA (EU Food Safety Authority)**: for European users.
- **RASFF (EU Rapid Alert System for Food and Feed)**: supplements EFSA for cross-border alerts.
- **CFIA (Canada)**: for Canadian users.
- **Recall source is geo-scoped**: a user in Germany does not receive FDA alerts for products not sold in Germany. A user who has traveled to the US and scanned US products continues to receive FDA alerts for those specific products.

Upstash QStash polls each recall API on a configurable interval (every 15 minutes for FDA, hourly for others). New recall entries are diffed against the last seen state. Net-new recalls are pushed to a processing queue.

## Matching Logic

For each new recall entry:
1. Extract the product identifiers: UPC, lot number, brand name, product name, date range.
2. Query Supabase Postgres for all scan events matching those identifiers globally.
3. For each matching scan_event, retrieve the user_id and the scan timestamp.
4. If scan timestamp falls within the at-risk date range: flag as confirmed match.
5. If lot number is unknown (recall covers all lots): flag any scan of that product within the last 90 days.
6. For each flagged user: write a `recall_alert` record, trigger push notification via the user's Brain DO.

The Brain DO receives the recall match, evaluates push conditions (critical priority — always delivered regardless of quiet hours), and fires the notification.

## Notification Content

Critical priority. No suppression. No quiet hours exception — a Listeria recall does not care that it is 2am.

Format:
- Title: "Recall: [Product Name]"
- Body: "A product you scanned on [date] has been recalled for [reason]. Check your fridge."
- Action: opens the recall detail screen with full FDA notice and disposal instructions.

The notification never says "you might have this" if the lot match is confirmed. It says "you have this." If the lot is unknown and it's a broad match, it says "you may have this."

## Recall Detail Screen

- Product name and photo (from scan history).
- Recall reason (verbatim from the issuing authority).
- Lot numbers affected (highlighted if the user's scanned lot is in range).
- What to do: return to store for refund / do not consume / discard.
- Link to full official recall notice.
- One-tap "I discarded it" confirmation — marks the alert as resolved.

## Data Model

- `recall_entry`: recall_id, source (fda/efsa/cfia), product_name, upc, lot_numbers_json, reason, issued_at, expires_at, raw_notice_url.
- `recall_scan_match`: match_id, recall_id, user_id, scan_event_id, match_confidence (confirmed/probable), notified_at, resolved_at.

## Edge Cases

- User scanned the product but the lot number on the recall does not match their scan: downgrade to low-priority informational notification, not critical.
- Recall is retracted after notification: send a follow-up "The recall for [product] has been cleared. No further action needed."
- User has already eaten the product (scan timestamp is old): still notify. Symptoms can appear days later.

## Technical Constraints

- Recall polling must not be affected by the per-user DO lifecycle. Polling runs as a global Upstash QStash cron, not inside any user's DO.
- The match query against Supabase must be batch-efficient: one query per recall entry against all scan_events, not one query per user.
- Push delivery is routed through each user's Brain DO to respect their device token and notification state.

## Success Metrics

- Recall match notification delivery rate (alerts sent vs. qualifying matches found).
- User "I discarded it" confirmation rate (proxy for alert being acted on).
- Time from FDA recall issue to user notification (target: under 30 minutes).
- Retention impact: users who receive a recall alert and return to the app within 24 hours.
