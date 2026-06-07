# Bela — Data Model

## Where Data Lives

| Store | What lives there |
|---|---|
| **Supabase Postgres** | orders, order_items, order_events, shoppers, shopper_scan_log, standing_orders, standing_order_cycles, order_payment_events, family_links, disputes |
| **Orchestrator DO SQLite** (per user) | recipient_profiles, pantry_model (agent_state keys), user_find_history (see spec 35) |
| **OrderAgent DO** (per order) | Active order state machine, live scan session WebSocket relay, constraint snapshot cache |
| **Cloudflare R2** | Delivery photos, dispute photos |

Orders and shoppers are shared, community-level data — they belong in Supabase. User dietary profiles are per-user, private data — they belong in the Orchestrator DO. Bela does not use a user wallet balance.

---

## Supabase Tables

### `shoppers`

```sql
CREATE TABLE shoppers (
  shopper_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text NOT NULL UNIQUE,        -- Brioela user account ID (the shopper is also a Brioela user)
  display_name        text NOT NULL,               -- first name only, shown in order dispatch
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','active','suspended','banned')),
  city                text NOT NULL,               -- city where they operate
  veriff_session_id   text,                        -- KYC verification session ref
  background_clear    boolean NOT NULL DEFAULT false,
  stripe_connect_id   text,                        -- Stripe Connect Express account ID
  quality_score       numeric(5,2) DEFAULT 100.0,  -- 0–100, recalculated per order
  constraint_compliance_score  numeric(5,2) DEFAULT 100.0,
  item_accuracy_score          numeric(5,2) DEFAULT 100.0,
  delivery_accuracy_score      numeric(5,2) DEFAULT 100.0,
  satisfaction_score           numeric(5,2),       -- nullable — no score if user never rated
  total_orders_completed       int NOT NULL DEFAULT 0,
  ground_contribution_consent  boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shoppers_city_status ON shoppers (city, status);
CREATE INDEX idx_shoppers_quality ON shoppers (quality_score DESC) WHERE status = 'active';
```

### `orders`

```sql
CREATE TABLE orders (
  order_id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  text NOT NULL,           -- the user who placed the order
  recipient_user_id        text,                    -- if ordering for another Brioela user; NULL if self or non-user
  shopper_id               uuid REFERENCES shoppers(shopper_id),
  status                   text NOT NULL DEFAULT 'pending'
                             CHECK (status IN (
                               'pending','accepted','shopping','in_transit',
                               'delivered','completed','disputed','cancelled',
                               'refunded'
                             )),
  city                     text NOT NULL,
  delivery_address_json    jsonb NOT NULL,          -- { street, neighborhood, city, lat, lng, contact_phone }
  delivery_window_start    timestamptz NOT NULL,
  delivery_window_end      timestamptz NOT NULL,
  estimated_total_cents    int NOT NULL,
  actual_total_cents       int,                     -- set at completion from final item list
  service_fee_cents        int,
  stripe_payment_intent_id text,                   -- escrow hold intent
  escrow_hold_amount_cents int,
  source_kind              text                     -- 'direct','standing_order','cooking_intent','recipe_save'
                             CHECK (source_kind IN ('direct','standing_order','cooking_intent','recipe_save')),
  source_ref               text,                   -- ID of standing_order, session, or recipe that triggered this
  delivery_photo_r2_url    text,                   -- uploaded by shopper before delivery confirmation
  created_at               timestamptz NOT NULL DEFAULT now(),
  accepted_at              timestamptz,
  shopping_started_at      timestamptz,
  delivered_at             timestamptz,
  completed_at             timestamptz
);

CREATE INDEX idx_orders_user ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_shopper ON orders (shopper_id, status);
CREATE INDEX idx_orders_city_status ON orders (city, status) WHERE status IN ('pending','accepted');
CREATE INDEX idx_orders_status ON orders (status, created_at DESC);
```

### `order_items`

```sql
CREATE TABLE order_items (
  item_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id       text,                    -- NULL if description-only item (not resolved to canonical ID)
  description      text NOT NULL,           -- human-readable item name (always set)
  quantity         text NOT NULL,           -- "2 kg", "1 jar", "3 pieces" — string not int, quantity is varied
  user_note        text,                    -- "get the large bag", "any brand is fine"
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','found','substituted','unavailable','blocked')),
  scanned_product_id text,                 -- what the shopper actually scanned and bought (may differ from product_id)
  actual_price_cents int,                  -- price paid for this item (from receipt if available)
  substitution     boolean NOT NULL DEFAULT false,
  substitution_approved_by text            -- 'user', 'auto_timeout', NULL if not a substitution
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
```

### `order_events`

```sql
CREATE TABLE order_events (
  event_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  kind         text NOT NULL,
  -- kinds: 'status_change', 'item_scanned', 'scanner_block', 'scanner_soft_warning',
  --        'substitution_offered', 'substitution_approved', 'substitution_declined',
  --        'user_message', 'shopper_message', 'user_override', 'unresolved_product_manual_check',
  --        'delivery_photo_submitted', 'dispute_opened', 'dispute_resolved'
  payload_json jsonb,
  actor        text CHECK (actor IN ('user','shopper','system','orderagent')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_events_order ON order_events (order_id, created_at DESC);
CREATE INDEX idx_order_events_kind ON order_events (kind, created_at DESC);
```

### `order_constraint_snapshot`

```sql
CREATE TABLE order_constraint_snapshot (
  order_id       uuid PRIMARY KEY REFERENCES orders(order_id) ON DELETE CASCADE,
  snapshot_json  jsonb NOT NULL,   -- full OrderConstraintSnapshot as JSON
  captured_at    timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL  -- captured_at + 90 days
);
```

### `standing_orders`

```sql
CREATE TABLE standing_orders (
  standing_order_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            text NOT NULL,
  recipient_user_id  text,           -- if for another user
  recipient_profile_id text,         -- if for a non-Brioela recipient (stored in Orchestrator DO, referenced here)
  frequency          text NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly')),
  day_of_week        int CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday for weekly/biweekly; NULL for monthly
  day_of_month       int CHECK (day_of_month BETWEEN 1 AND 28),  -- for monthly
  delivery_window_start_hour int NOT NULL,  -- 9 = 9am
  delivery_window_end_hour   int NOT NULL,  -- 12 = 12pm
  delivery_address_json jsonb NOT NULL,
  budget_cap_cents    int,          -- NULL = no cap
  auto_confirm        boolean NOT NULL DEFAULT true,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  next_cycle_date     date NOT NULL
);

CREATE INDEX idx_standing_orders_user ON standing_orders (user_id);
CREATE INDEX idx_standing_orders_next ON standing_orders (next_cycle_date) WHERE status = 'active';
```

### `standing_order_cycles`

```sql
CREATE TABLE standing_order_cycles (
  cycle_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standing_order_id  uuid NOT NULL REFERENCES standing_orders(standing_order_id),
  order_id           uuid REFERENCES orders(order_id),  -- NULL until confirmed and dispatched
  cycle_date         date NOT NULL,
  status             text NOT NULL DEFAULT 'proposed'
                       CHECK (status IN ('proposed','confirmed','skipped','dispatched','completed')),
  proposed_items_json jsonb,         -- the AI-generated list before user review
  confirmed_items_json jsonb,        -- after user edits (same as proposed if not edited)
  estimated_total_cents int,
  user_notified_at   timestamptz,
  user_confirmed_at  timestamptz,    -- NULL if auto-confirmed
  auto_confirmed     boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_standing_order_cycles_standing ON standing_order_cycles (standing_order_id, cycle_date DESC);
```

### `disputes`

```sql
CREATE TABLE disputes (
  dispute_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(order_id),
  user_id         text NOT NULL,
  dispute_type    text NOT NULL CHECK (dispute_type IN ('wrong_item','missing_item','constraint_violation','quality')),
  affected_items  jsonb NOT NULL,    -- array of order_item IDs
  user_photo_r2_url text,           -- for quality disputes
  status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','auto_resolved','manual_review','resolved','rejected')),
  resolution      text,             -- human-readable resolution reason
  refund_amount_cents int,          -- 0 if no refund
  shopper_quality_impact jsonb,     -- score changes applied to shopper
  auto_resolved   boolean NOT NULL DEFAULT false,
  opened_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);

CREATE INDEX idx_disputes_order ON disputes (order_id);
CREATE INDEX idx_disputes_status ON disputes (status, opened_at DESC);
```

### Payment ledger

Bela does not use a user wallet transaction table. Every financial event for an order is stored in
`order_payment_events`. Stripe PaymentIntent and Stripe Connect are the payment source of truth;
Brioela's ledger is an audit log, not a balance system.

### `shopper_scan_log`

```sql
CREATE TABLE shopper_scan_log (
  log_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  shopper_id      uuid NOT NULL REFERENCES shoppers(shopper_id),
  scanned_at      timestamptz NOT NULL,
  product_id      text,
  barcode         text,
  result_kind     text NOT NULL
                    CHECK (result_kind IN (
                      'match','category_match','no_match','hard_block','soft_warning',
                      'unresolved_manual_check','unavailable'
                    )),
  constraint_block_kind text,      -- 'allergy','intolerance','boycott' — NULL if no block
  constraint_block_entity text,    -- 'sesame','Nestlé' — NULL if no block
  action_taken    text             -- 'purchased','skipped','substitute_offered'
);

CREATE INDEX idx_shopper_scan_log_order ON shopper_scan_log (order_id);
CREATE INDEX idx_shopper_scan_log_shopper ON shopper_scan_log (shopper_id, scanned_at DESC);
```

### `family_links`

```sql
CREATE TABLE family_links (
  link_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a    text NOT NULL,
  user_id_b    text NOT NULL,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','active','unlinked')),
  initiated_by text NOT NULL,   -- user_id of whoever sent the request
  created_at   timestamptz NOT NULL DEFAULT now(),
  linked_at    timestamptz,
  UNIQUE (user_id_a, user_id_b)
);

CREATE INDEX idx_family_links_user ON family_links (user_id_a) WHERE status = 'active';
CREATE INDEX idx_family_links_user_b ON family_links (user_id_b) WHERE status = 'active';
```

---

## Orchestrator DO SQLite Tables

These live in the per-user Orchestrator DO SQLite database, not in Supabase.

```sql
-- Non-Brioela recipients managed by this user
CREATE TABLE recipient_profiles (
  id              TEXT PRIMARY KEY,
  nickname        TEXT NOT NULL,
  phone           TEXT,
  address_json    TEXT NOT NULL,
  constraints_json TEXT,
  notes           TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Bela has no cached user wallet balance.
-- Payment state is per-order via Stripe PaymentIntent + order_payment_events.
```

---

## OrderAgent DO — In-Memory State Only

The OrderAgent DO holds state in memory for the duration of the active order. Nothing in the OrderAgent persists beyond what is written to Supabase `order_events` and `order_items` at each state transition. If the OrderAgent DO is evicted mid-order, it recovers by reading the last `order_events` row to determine current state and rebuilds the constraint snapshot cache from `order_constraint_snapshot`.

```typescript
interface OrderAgentState {
  orderId:            string
  userId:             string
  shopperId:          string
  status:             OrderStatus
  constraintSnapshot: OrderConstraintSnapshot  // loaded from Supabase at DO start
  userWs:             WebSocket | null         // live scan session connection
  shopperWs:          WebSocket | null
  pendingSubstitution: {
    itemId:    string
    scannedProductId: string
    expiresAt: number   // auto-approve timestamp
  } | null
}
```
