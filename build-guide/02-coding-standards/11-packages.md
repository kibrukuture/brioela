# Packages and Dependencies

## The Rule

Every package in the codebase has a specific job. When a package exists for a job, that package is always used — no alternative approaches, no reimplementing what the package does, no adding a second package that does the same thing.

Before installing a new package, check this file. If a package is listed here, use it. If it isn't listed and you need something new, add it here before adding it to `package.json` — so the decision is recorded.

---

## Root — `package.json` (workspace tools only)

```json
{
  "workspaces": ["backend", "shared", "mobile"],
  "dependencies": {}
}
```

Nothing goes in root dependencies except monorepo tooling. All application packages live in the workspace that uses them.

---

## Shared — `@brioela/shared`

| Package | Version | Purpose |
|---|---|---|
| `zod` | `^4.x` | All schema validation — single source of truth |
| `drizzle-orm` | `^0.44.x` | Drizzle table definitions (re-used by backend) |
| `typescript` | `^5.x` | Language |

No runtime dependencies beyond Zod and Drizzle in the shared package. The shared package runs in both Node.js (backend) and React Native (mobile) — nothing platform-specific.

---

## Backend — `@brioela/backend`

### Core Framework

| Package | Purpose |
|---|---|
| `hono` | HTTP framework — all routing |
| `@hono/zod-validator` | Zod validation middleware for Hono routes |

### Cloudflare

| Package | Purpose |
|---|---|
| `@cloudflare/agents` | CF Agent SDK — Durable Object base class |
| `@cloudflare/workers-types` | TypeScript types for CF Workers runtime |
| `wrangler` | CF deploy tool (devDependency) |

### Database

| Package | Purpose |
|---|---|
| `drizzle-orm` | ORM for both Supabase Postgres and DO SQLite |
| `drizzle-kit` | Migration generation (devDependency) |
| `postgres` | Postgres JS driver for Supabase connection |

### Upstash

| Package | Purpose |
|---|---|
| `@upstash/redis` | Redis client — caching, rate limiting |
| `@upstash/qstash` | QStash client — one-shot async jobs |
| `@upstash/workflow` | Workflow client — multi-step durable flows |

### Supabase

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client — auth, real-time subscriptions |

### AI

| Package | Purpose |
|---|---|
| `@google/genai` | Google Gemini SDK — Gemini Live for cooking sessions |
| `@anthropic-ai/sdk` | Anthropic Claude SDK — orchestrator reasoning |

### IDs and Utilities

| Package | Purpose |
|---|---|
| `nanoid` | Cryptographically secure short ID generation |
| `dayjs` | Date manipulation — lightweight, immutable |

### Payments

| Package | Purpose |
|---|---|
| `stripe` | Stripe SDK — Bela escrow, shopper payouts |

---

## Mobile — `@brioela/mobile`

### Expo Base

| Package | Purpose |
|---|---|
| `expo` | Core Expo SDK |
| `expo-router` | File-based navigation |
| `react-native` | React Native runtime |
| `react` | React |

### Styling

| Package | Purpose |
|---|---|
| `nativewind` | Tailwind CSS for React Native — ALL styling |
| `tailwindcss` | Tailwind core (devDependency) |
| `class-variance-authority` | CVA — typed component variants |
| `clsx` | Conditional class names |
| `tailwind-merge` | Merge Tailwind classes without conflicts |

### Animation and GPU

| Package | Purpose |
|---|---|
| `@shopify/react-native-skia` | GPU rendering — shaders, glow, glass, particles |
| `react-native-reanimated` | Animation worklets — springs, layout animations |
| `moti` | Declarative spring animations over Reanimated |

### Fonts and Assets

| Package | Purpose |
|---|---|
| `expo-font` | Font loading via config plugin |

Fonts loaded via OTF files in `assets/fonts/` — no expo-google-fonts packages needed since OTF files are committed directly.

### Haptics and Hardware

| Package | Purpose |
|---|---|
| `expo-haptics` | Haptic feedback |
| `expo-camera` | Camera access for scan and cooking |
| `expo-barcode-scanner` | Barcode / UPC detection |

### Navigation and Layout

| Package | Purpose |
|---|---|
| `react-native-safe-area-context` | Safe area insets |
| `react-native-gesture-handler` | Gesture recognition |
| `react-native-screens` | Native screen management |

### Icons

| Package | Purpose |
|---|---|
| `phosphor-react-native` | Icon system — six-weight axis |

### State and Data

| Package | Purpose |
|---|---|
| `@tanstack/react-query` | Server state — all API data fetching |
| `zustand` | Client state — global UI state stores |
| `usehooks-ts` | Effect hooks — `useIsomorphicLayoutEffect` (REQUIRED) |

### Networking

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client — auth, real-time |

### Maps

| Package | Purpose |
|---|---|
| `@rnmapbox/maps` | Mapbox GL — map rendering |

### Notifications

| Package | Purpose |
|---|---|
| `expo-notifications` | Push notification handling |

### Blur (simple cases)

| Package | Purpose |
|---|---|
| `expo-blur` | Simple BlurView for non-Skia blur cases |

---

## What Is Explicitly Banned

| Banned | Reason | Use instead |
|---|---|---|
| `axios` | Unnecessary on modern runtimes | Native `fetch` or Hono RPC client |
| `moment` | Heavy and deprecated | `dayjs` |
| `lodash` / `lodash-es` | Usually not needed with modern JS | Implement inline |
| `react-navigation` | Already using Expo Router | Expo Router only |
| `StyleSheet` (React Native) | NativeWind replaces it | NativeWind className only |
| `ActivityIndicator` | Design system has its own loading patterns | See `12-loading-and-empty-states.md` |
| `react-native-vector-icons` | Using Phosphor | `phosphor-react-native` only |
| `ioredis` | Using Upstash | `@upstash/redis` only |
| `pg` (raw postgres) | Using Drizzle | `drizzle-orm` + `postgres` driver |
| `express` | Not supported on CF Workers | `hono` only |
| `Framer Motion` | Web only | `moti` + `react-native-reanimated` |
| `useEffect` directly | CLAUDE.md requirement | `useIsomorphicLayoutEffect` from `usehooks-ts` |
| `useLayoutEffect` directly | CLAUDE.md requirement | `useIsomorphicLayoutEffect` from `usehooks-ts` |

---

## Adding a New Package

Before adding any new package to any `package.json`:
1. Check if an existing listed package already covers the need
2. Verify the package is actively maintained (last release < 6 months or steady LTS)
3. Verify it works on the correct runtime (Cloudflare Workers edge runtime for backend, React Native for mobile — many web packages do not work on either)
4. Add it to this file under the correct workspace with its purpose documented
5. Then install it: `bun add <package> --cwd <workspace>`
