# Platform Design System — Spec

Feature **02**. Brioela's visual and interaction language for the Expo mobile app: design tokens, typography, spacing, motion, Skia GPU layers, haptics, CVA component variants, icon system, loading/empty states, evidence-first UI patterns, and the static fallback layer for generative UI (**52**). Every product feature UI (03, 24–54) composes from this system — nothing is styled ad hoc in feature files.

---

## Purpose

The design system owns what must exist before Brioela product surfaces ship on mobile:

1. **Token architecture** — primitive → semantic → component color layers; 4pt spacing grid; type scale; radius and icon sizes.
2. **Styling stack** — NativeWind (Tailwind) exclusively for layout/color/type classes; no `StyleSheet.create` in product code.
3. **Component library** — shared `mobile/components/*` primitives (Button, GlassCard, VerdictField, GlowRing, AmbientCanvas, …) built with CVA variants from `mobile/design-system/variants/`.
4. **Motion + haptics** — named Reanimated spring configs; semantic `haptic.*` tokens paired with motion on the same frame.
5. **Skia layers** — five named GPU layers (ambient field, glow ring, liquid glass, map signal dots, holographic surface).
6. **Theme** — light-first warm cream palette; dark mode via NativeWind `dark:` + semantic token swap.
7. **Evidence-first UI** — product answer first, evidence second; cross-feature layout rules for scanner, Bela, Passport, receipts, recalls, etc.
8. **Generative UI foundation** — static fallback templates and registered components that **52** consumes; 400ms progressive render rule (`06-generative-ui.md`, superseded in delivery by `27-generative-grammar/`).

This is **not** feature business logic (scanner verdict assembly **24**, grammar runtime **52**, auth UX **03), or monorepo shell (**01**). It is the attach point for all mobile UI.

---

## Architecture

```text
app/_layout.tsx (root providers + optional AmbientCanvas)
        │
        ├── design-system/          tokens, motion, haptics, variants, shaders
        ├── components/             shared UI primitives (CVA + NativeWind)
        ├── features/{feature}/     composes primitives + network hooks
        └── app/                    thin Expo Router screens
```

Hard doctrine (from `build-guide/01-design-system/00-overview.md` + `00-rules.md`):

- **Light mode first.** Dark mode fully supported; every decision made light-first.
- **NativeWind exclusively** for styling in product code — no `StyleSheet.create`.
- **CVA for all design-system components** — no ad-hoc conditional class strings.
- **Phosphor Icons only** — six-weight axis; duotone never used.
- **No skeleton screens, no PNG textures, no ActivityIndicator** — Breath / Presence / Glass Sweep patterns instead.
- **Evidence-first** — verdict/answer is headline; scores and field names are supporting context.
- **Generative UI** — AI returns typed JSON; client validates with Zod; static fallback on failure; 400ms ceiling.

Path convention: monorepo uses **no `src/` wrapper** under `mobile/` (`03-foundation/05-mobile-setup.md`, `01-monorepo-and-folder-structure.md`). Target paths are `mobile/design-system/*`, not `src/design-system/*` (legacy references in some design-system MD files mean `mobile/design-system/`).

---

## Token system

### Color (`02-color-system.md`)

Three levels:

| Level | Role | Example |
|---|---|---|
| Primitive | Raw hex/rgba — never in components | `cream: #F8F6F2`, `greenDeep: #2D7A4F` |
| Semantic | Intent-based — what components use | `background.primary`, `text.secondary`, `accent.danger` |
| Component | Rare per-component overrides | VerdictField bloom targets |

**Light-first palette:** warm cream `#F8F6F2` background, warm near-black `#1C1917` text, sage accent `#2D7A4F` (light) / `#4DB87A` (dark).

**Verdict Field:** context-reactive color bloom behind glass surfaces when AI evaluates something. Safe/caution/danger each have light and dark bloom gradients. Springs: safe 180/0.85, caution 220/0.90, danger 600/1.0 (snap). Neutral = no bloom.

**Rules:** no raw hex in className; no Tailwind default palette (gray, slate, stone); Skia/Reanimated import from `design-system/colors.ts`.

**Internal spec conflict:** `03-foundation/05-mobile-setup.md` sample `global.css` uses teal `#14B8A6` for `--accent-primary`. `02-color-system.md` uses sage green. **Design-system folder wins.**

### Typography (`01-typography.md`)

| Role | Font | Package | Size range |
|---|---|---|---|
| Display / emotive | Cormorant Garamond | `@expo-google-fonts/cormorant-garamond` or OTF in `assets/fonts/` | 32pt+ only |
| UI / heading | Plus Jakarta Sans | OTF committed | 10–32pt |
| Body / reading | DM Sans | OTF committed | 13–17pt, `leading-reading` 1.65× |

Type scale tokens: `display-xl` through `body-sm`. NativeWind classes: `font-cormorant`, `font-jakarta`, `font-dm`, `text-heading-lg`, etc.

**Font loading (spec):** expo-font **config plugin** in `app.json` — all weights at startup, no `useFonts()` in components.

### Spacing (`03-spacing.md`)

4pt base grid. Tokens `space.1` (4pt) through `space.24` (96pt). Layout constants: `layout.screenPaddingH` 20pt, `layout.tabBarHeight` 56pt, etc.

**Generative UI ordinal spacing:** AI emits `space_xs` … `space_2xl`; renderer maps to numeric tokens. AI must never emit `p-4`, `space.4`, or metaphor names.

### Motion (`04-motion.md`)

| Tool | Use |
|---|---|
| Reanimated 3/4 | Interactive springs, layout animations, SharedValues → Skia uniforms |
| Moti | Simple declarative mount/unmount only |
| Skia | GPU shaders, blur glass, glow, ambient field |

Named springs: `landing`, `dismiss`, `light`, `micro`, `snap`, `slow`. No core `Animated`; no `useEffect` for animation triggers — `useIsomorphicLayoutEffect` from `usehooks-ts` when needed. `useReduceMotion()` / instant state when reduce motion enabled.

### Haptics (`08-haptics.md`)

Semantic module `design-system/haptics.ts`: `haptic.selection`, `haptic.impact.*`, `haptic.verdict.*`. Paired with motion on same event. Settings toggle makes all calls no-ops. No direct `Haptics.*` in feature code.

### Texture (`09-texture.md`)

SkSL grain on root ambient canvas only. Light amplitude 0.012, dark 0.018. Static `seed` per session — never animated.

---

## Skia layers (`05-skia-layers.md`)

| Layer | Component | Role |
|---|---|---|
| 1 | `AmbientCanvas` | FractalNoise background + texture pass; root-mounted |
| 2 | `GlowRing` | Scan ring, SweepGradient, lock/pulse states |
| 3 | `GlassCard` | BackdropFilter blur surfaces for cards/sheets |
| 4 | Map signal dots | Ground + healthy map overlays (**27**, **28**) |
| 5 | Holographic surface | Milestone-only iridescence + accelerometer tilt |

Shader sources: `mobile/design-system/shaders/*.glsl.ts` — never inline in components.

---

## Component conventions

### CVA (`10-cva-component-variants.md`)

All design-system components use `class-variance-authority`. Variants live in `mobile/design-system/variants/`. `cn()` from `lib/cn.ts` merges classes. Animated values stay in Reanimated — never inside CVA.

### Icons (`11-icon-system.md`)

`phosphor-react-native` only. Weight matches adjacent typography. Active state: regular → fill crossfade with `spring.micro`. Min tap target 44×44pt.

### Loading / empty (`12-loading-and-empty-states.md`)

| Pattern | When |
|---|---|
| Breath | In-flight card content — opacity pulse on container |
| Presence | Generative slot — invisible until decision or 400ms static fallback |
| Glass Sweep | Multi-item list load — one Skia sweep, not loop |
| Spinner | One case only: explicit user-wait action with no partial content |

Empty state: raised ambient intensity + one Cormorant `text-display-sm` line + one ghost/secondary action. No illustrations, no ActivityIndicator.

### Evidence-first UI (`13-evidence-first-ui.md`)

Surface order: answer → why it matters → evidence → next action → raw details on demand.

Applies to: scanner (**24**), Bela (**42**, **45**), Passport (**47**), receipts (**33**), recalls (**31**), illness (**32**), menu (**26**), wearables (**36**), Ground (**27**). Feature specs reference this file for copy hierarchy — implementation uses shared typography/spacing tokens.

---

## Generative UI foundation (`06-generative-ui.md` + **52**)

**Pattern (decided):** Server returns `BrioelaGenerativeUiDocument`; client validates; renders registered primitives or static fallback.

**Delivery (superseded for code paths):** `build-guide/27-generative-grammar/` + feature **52** own `shared/grammar/`, `mobile/grammar/`. Old path `src/generative-ui/registry.ts` in `06-generative-ui.md` is **not** the target.

**02 still owns:** token primitives, static fallback **templates** (Discovery Card **51**, scan verdict layout **24**), registered non-generative components referenced by grammar catalog.

**Never generative:** allergen hard blocks, medical flags, navigation, settings, network/auth errors, recall alerts, onboarding.

**400ms rule:** static content renders immediately; generative enhancement within 400ms or permanent static — no spinner in generative slot.

---

## Design philosophy (`07-design-philosophy.md`)

Grounded in `brioela-specs/00-product-philosophy-and-ux.md`:

- Ambient intelligence — idle states breathe; proactive not dashboard-heavy.
- Two brain cell standard — ≤10 words to understand a screen; primary action obvious.
- Zero form policy — no form fields except auth/legal; keyboard is exceptional.
- Depth/glass grammar — background → glass mid-layer → foreground actions.
- Restraint — display font, holographic shimmer, verdict bloom only when earned.

---

## Mobile UI architecture (`03-foundation/05-mobile-setup.md`, `09-mobile-patterns.md`)

| Layer | Location | Rule |
|---|---|---|
| Screens | `mobile/app/` | Thin — compose feature root; ≤40 lines |
| Feature UI | `mobile/features/{name}/` | Root component + `_hooks/` + `_components/` |
| Server state | `mobile/network/{domain}/` | TanStack Query; no fetch in components |
| Client state | `mobile/stores/{concern}/` | Zustand — one store per concern |
| Shared UI | `mobile/components/` | Design-system primitives |
| Tokens/variants | `mobile/design-system/` | colors, motion, haptics, variants, shaders |

**Effects:** `useIsomorphicLayoutEffect` from `usehooks-ts` only.

**Intended tab shell (Brioela):** scanner, ground, map, profile (`05-mobile-setup.md`).

---

## Integration with product features

Features that **consume** design system (non-exhaustive):

| Feature | Design-system dependency |
|---|---|
| **24** scanner | GlowRing, VerdictField, evidence-first verdict card, haptic.verdict |
| **27** ground, **28** map | Skia Layer 4 signal dots, pulse shaders |
| **26** menu, **31** recall, **32** illness, **33** receipt | Evidence-first sheet layouts |
| **42** bela, **45** in-store | Shopper-safe evidence copy patterns |
| **44** kids mode | Display font discipline; simplified hierarchy |
| **47** passport | Boarding-pass instruction layout |
| **50** kin | Family surfaces — shared tokens, not separate theme |
| **51** viral sharing | Discovery Card static templates (grammar fallback) |
| **52** generative grammar | Tokens, motion beats, Skia atmosphere; consumes **02** primitives |

Features listing **02** in blocked-by: **01** (shell), **51**, **52**. Others reference design-system docs without explicit blocked-by.

---

## Intended vs shipped (summary)

### Intended (build guides)

- Full `mobile/design-system/` tree: `colors.ts`, `typography.ts`, `spacing.ts`, `motion.ts`, `haptics.ts`, `variants/`, `shaders/`.
- Shared components: Button, GlassCard, VerdictField, GlowRing, AmbientCanvas, Icon, ErrorBoundary.
- Brioela fonts (Cormorant, Plus Jakarta, DM Sans), warm cream tokens, sage accent.
- NativeWind `tailwind.config` extended with semantic tokens + type scale.
- Root `AmbientCanvas` + verdict/haptic pairing.
- Phosphor-only icons; CVA everywhere; zero StyleSheet.

### Shipped (evidence: `mobile/` tree)

- **Partial NativeWind stack:** `nativewind` 4.1, `tailwind.config.js`, `global.css`, `lib/cn.ts`, `class-variance-authority` installed.
- **Legacy Schnl/fintech theme:** iOS system colors in `theme/colors.ts` + shadcn-style CSS variables in `global.css` (blue primary `#007BFE`, gray background).
- **Fonts:** Inter via `@expo-google-fonts/inter` + `parafina_black`; not Brioela trio.
- **Icons:** mixed — `lucide-react-native`, `@roninoss/icons`, `@expo/vector-icons`, some `phosphor-react-native`.
- **No `mobile/design-system/` folder** — zero token modules, zero variant files, zero shaders.
- **No Brioela shared components** from spec (GlassCard, VerdictField, GlowRing, AmbientCanvas, Button folder pattern).
- **Skia:** dependency present; one onboarding prototype only.
- **Haptics:** direct `expo-haptics` calls in features; no semantic module.
- **CVA:** zero usage despite package installed.
- **StyleSheet.create:** present in ~16 files (violates spec).
- **Tabs:** Home / Activities / Recipients / Cards — Schnl banking, not Brioela product tabs.
- **Extra UI libs not in spec:** `react-native-paper` (PaperProvider in root layout), NativeWindUI scaffold in `cesconfig.json`.

Status remains **`open`** — docs complete; production alignment not started.

---

## Conflicts (spec vs production)

| ID | Spec / guide | Production | Resolution |
|---|---|---|---|
| C1 | Warm cream `#F8F6F2` bg | `#FFFFFF` splash, `#F2F2F7`-style system grays | Replace theme when implementing **02** |
| C2 | Sage accent `#2D7A4F` | Blue primary `#007BFE` / `#0071E9` | Use color-system primitives |
| C3 | Plus Jakarta + Cormorant + DM Sans | Inter + parafina | Load OTF per typography spec |
| C4 | expo-font config plugin, no useFonts | `useFonts` in `_layout.tsx` | Migrate to plugin when fonts finalized |
| C5 | Phosphor only | Lucide, RoninOSS, Expo vector icons | Replace at touch points |
| C6 | No StyleSheet | ~16 files with StyleSheet.create | Refactor to NativeWind |
| C7 | `mobile/design-system/` | Folder absent | Create tree per build.md |
| C8 | Generative registry at `src/generative-ui/` | **52** uses `shared/grammar/` | Follow **52** for runtime; **02** owns static templates |
| C9 | Foundation global.css teal accent | Color-system sage | Color-system wins |
| C10 | Brioela tabs (scan, ground, map, profile) | Banking tabs | Product shell migration (**01** + **02**) |

---

## Dependencies

### Blocked by

- **01-platform-foundation** (partial) — Expo workspace, NativeWind wired, but Schnl shell/tabs/URLs not aligned.

### Blocks

- **03-platform-auth-onboarding** — auth screens need tokens + components.
- **24-scanner** through **54-tonight** — any mobile UI surface.
- **51-viral-sharing** — Discovery Card static templates.
- **52-generative-grammar** — token primitives, motion/Skia base components, static fallbacks.

---

## Sources

See full list in `status.md` Sources section (all MD files read for this migration).
