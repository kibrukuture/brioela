# Status

open

Build-guide **01-design-system** is complete (14 files). Production mobile app has **partial** NativeWind infrastructure (global.css, tailwind.config, cn, dark mode toggle) inherited from **Schnl/fintech** UI — but **zero** Brioela design-system implementation: no `mobile/design-system/` folder, no spec tokens/fonts/components/Skia layers, widespread legacy styling. Feature is **not** done — status stays `open`.

# Shipped in repo (partial)

## NativeWind / tooling
- [x] `nativewind` 4.1 + `tailwindcss` 3.4 + `nativewind-env.d.ts`
- [x] `global.css` with CSS variables (Schnl/shadcn-style palette)
- [x] `tailwind.config.js` — `darkMode: 'class'`, NativeWind preset, platformSelect opacity helper
- [x] `lib/cn.ts` — clsx + tailwind-merge (matches spec)
- [x] `lib/useColorScheme.tsx` — NativeWind toggle + Android nav bar sync
- [x] `components/ui/theme-toggle.tsx` — manual dark mode control

## Packages installed (unused or legacy)
- [x] `class-variance-authority` — **zero** `cva(` usage in mobile
- [x] `@shopify/react-native-skia` 2.6.4 — one onboarding prototype only
- [x] `react-native-reanimated` 4.4.0, `moti` 0.30.0
- [x] `expo-haptics` — direct feature calls, no semantic module
- [x] `phosphor-react-native` — partial; mixed with lucide/roninoss/vector-icons
- [x] `usehooks-ts` — used in root layout and some hooks

## Theme (legacy)
- [x] `theme/colors.ts` — iOS/Android **system** grays and blue primary
- [x] `theme/index.ts` — Expo Router NAV_THEME from system colors
- [x] Root `_layout.tsx` — providers stack (Query, PostHog, Paper, Keyboard, AppGate)
- [x] Fonts via `useFonts`: Inter + parafina (not Brioela trio)

## Shared UI (legacy Schnl)
- [x] `components/ui/*` — sheets, OTP, back button, segmented controls (~10 files)
- [x] Schnl tab shell: Home / Activities / Recipients / Cards
- [x] `providers/query-provider.tsx` — TanStack persist (24h gcTime)

## Docs-only (spec complete, no code)
- [x] Full `build-guide/01-design-system/` (00–13)
- [x] Evidence-first UI patterns referenced by **24**, **27**, **28**, **31**, **33**, **47**, etc.
- [x] Generative UI foundation doc (`06`) — delivery superseded by **52** / `27-generative-grammar/`

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `mobile/design-system/` directory at all | `glob mobile/design-system/**` — zero files |
| G2 | Color tokens are Schnl iOS blue/gray, not Brioela warm cream/sage | `theme/colors.ts` primary `rgb(0, 123, 254)`; spec `#2D7A4F` / `#F8F6F2` |
| G3 | `global.css` variables do not match `02-color-system.md` semantic tokens | `global.css` `--primary: 0 123 254`; spec sage + cream |
| G4 | Typography spec fonts not loaded (Cormorant, Plus Jakarta, DM Sans) | `app/_layout.tsx` loads Inter; `app.json` only parafina OTF |
| G5 | Font loading uses `useFonts()` hook — spec requires expo-font config plugin only | `_layout.tsx` lines 65–70; `01-typography.md` |
| G6 | `tailwind.config.js` maps `font-sans` → Inter, not jakarta/cormorant/dm | `tailwind.config.js` fontFamily block |
| G7 | No `design-system/motion.ts` spring library | `rg "design-system/motion" mobile` — zero |
| G8 | No `design-system/haptics.ts` semantic wrapper | Direct `Haptics.*` in e.g. `features/search/hooks/use-haptic-on-scroll.ts` |
| G9 | CVA installed but unused | `rg "cva\\(" mobile` — zero matches |
| G10 | No shared Button/GlassCard/VerdictField/GlowRing/AmbientCanvas components | `glob mobile/components/{Button,GlassCard,VerdictField,GlowRing,AmbientCanvas}/**` — zero |
| G11 | No Skia shader files under `design-system/shaders/` | `glob **/*.glsl.ts mobile` — zero |
| G12 | AmbientCanvas not mounted at root | `app/_layout.tsx` — no Skia canvas |
| G13 | Icon system violates spec — lucide + roninoss + vector-icons alongside Phosphor | e.g. `components/ui/back-button.tsx` lucide; theme-toggle roninoss |
| G14 | `StyleSheet.create` present (~16 files) — spec bans StyleSheet | `rg "StyleSheet.create" mobile` |
| G15 | Widespread banned Tailwind palette (`neutral-*`, etc.) | 100+ files use `neutral-` classes |
| G16 | Raw hex in className/icon color | e.g. back-button `#171717` |
| G17 | Tab shell is Schnl banking, not Brioela scan/ground/map/profile | `app/tabs/_layout.tsx` |
| G18 | Splash/background white `#FFFFFF`, not cream `#F8F6F2` | `app.json` splash; `_layout.tsx` SystemUI `#FFFFFF` |
| G19 | `react-native-paper` PaperProvider in root — not in design-system package list | `app/_layout.tsx` |
| G20 | `tailwind.config.js` content paths omit `features/**`, `design-system/**` | content array lines 7–13 |
| G21 | Moti installed, zero imports | `rg "from 'moti'" mobile` — zero |
| G22 | Loading patterns (Breath/Presence/GlassSweep) not implemented | no matches for BreathContainer etc. |
| G23 | Empty state spec (Cormorant + ambient intensity) not implemented | no EmptyState component |
| G24 | Verdict Field bloom system not implemented | no VerdictField component |
| G25 | Evidence-first layouts spec-only for product features | feature gap drafts reference **02** templates |
| G26 | Static generative fallback templates not implemented | **51** G12, **52** render helpers reference design-system fallback |
| G27 | Generative UI registry path in `06-generative-ui.md` obsolete | **52** uses `shared/grammar/` — not created either |
| G28 | Internal doc conflict: foundation `05-mobile-setup.md` global.css teal accent vs color-system sage | documented in spec C9 |
| G29 | Path drift: some design-system docs say `src/design-system/` | monorepo structure uses `mobile/design-system/` |
| G30 | NativeWindUI scaffold in cesconfig — not Brioela design system | `mobile/cesconfig.json` nativewindui package |
| G31 | `@expo-google-fonts/inter`, playfair, reenie-beanie in package.json — not spec fonts | `mobile/package.json` dependencies |
| G32 | Haptic settings toggle not wired to design-system module | `08-haptics.md` requires wrapper; no `hapticsEnabled` in design-system |

# Blocked by

- **01-platform-foundation** (partial) — mobile Expo workspace exists but Schnl shell, axios network client, non-Brioela tabs block clean design-system rollout.

# Blocks

- **03-platform-auth-onboarding** — auth UI needs tokens + shared components
- **24-scanner** through **54-tonight** — product mobile surfaces
- **51-viral-sharing** — Discovery Card static templates
- **52-generative-grammar** — token primitives, motion/Skia atmosphere, static fallbacks
- **01-platform-foundation** mobile alignment (tabs, cream shell) — co-owned with **02**

# Sources

## Design system build guide (primary)
- `build-guide/01-design-system/00-overview.md`
- `build-guide/01-design-system/01-typography.md`
- `build-guide/01-design-system/02-color-system.md`
- `build-guide/01-design-system/03-spacing.md`
- `build-guide/01-design-system/04-motion.md`
- `build-guide/01-design-system/05-skia-layers.md`
- `build-guide/01-design-system/06-generative-ui.md`
- `build-guide/01-design-system/07-design-philosophy.md`
- `build-guide/01-design-system/08-haptics.md`
- `build-guide/01-design-system/09-texture.md`
- `build-guide/01-design-system/10-cva-component-variants.md`
- `build-guide/01-design-system/11-icon-system.md`
- `build-guide/01-design-system/12-loading-and-empty-states.md`
- `build-guide/01-design-system/13-evidence-first-ui.md`

## Foundation + coding standards
- `build-guide/00-rules.md`
- `build-guide/03-foundation/05-mobile-setup.md`
- `build-guide/02-coding-standards/01-monorepo-and-folder-structure.md`
- `build-guide/02-coding-standards/04-imports-and-barrel-exports.md`
- `build-guide/02-coding-standards/09-mobile-patterns.md`
- `build-guide/02-coding-standards/11-packages.md`

## Generative grammar (UI delivery)
- `build-guide/27-generative-grammar/00-overview.md`
- `build-guide/27-generative-grammar/04-emotion-motion-skia.md`
- `build-guide/27-generative-grammar/16-atmosphere-skia-system.md`
- `build-guide/27-generative-grammar/17-motion-beats-system.md`

## Product specs
- `brioela-specs/00-product-philosophy-and-ux.md`
- `brioela-specs/39-generative-ui.md`
- `brioela-specs/35b-ground-finds-deep-design.md`

## Feature build guides (UI references)
- `build-guide/07-scanner/04-scan-result-ui.md`
- `build-guide/21-kids-mode/00-overview.md`
- `build-guide/24-viral-sharing/00-overview.md`
- `build-guide/24-viral-sharing/02-discovery-card-system.md`

## Migrated feature docs
- `_features/01-platform-foundation/spec.md`
- `_features/01-platform-foundation/build.md`
- `_features/01-platform-foundation/status.md`
- `_features/24-scanner/spec.md`
- `_features/27-ground/spec.md`
- `_features/27-ground/build.md`
- `_features/28-map/spec.md`
- `_features/28-map/build.md`
- `_features/28-map/status.md`
- `_features/47-passport/spec.md`
- `_features/47-passport/status.md`
- `_features/51-viral-sharing/spec.md`
- `_features/51-viral-sharing/build.md`
- `_features/51-viral-sharing/status.md`
- `_features/52-generative-grammar/spec.md`
- `_features/52-generative-grammar/build.md`
- `_features/52-generative-grammar/status.md`
- `_features/README.md`

## Records
- `_records/inventory/inventory.md`

## Production code audited
- `mobile/global.css`
- `mobile/tailwind.config.js`
- `mobile/theme/colors.ts`
- `mobile/theme/index.ts`
- `mobile/lib/cn.ts`
- `mobile/lib/useColorScheme.tsx`
- `mobile/app/_layout.tsx`
- `mobile/app/tabs/_layout.tsx`
- `mobile/app.json`
- `mobile/package.json`
- `mobile/tsconfig.json`
- `mobile/cesconfig.json`
- `mobile/nativewind-env.d.ts`
- `mobile/components/ui/back-button.tsx`
- `mobile/components/ui/theme-toggle.tsx`
- `mobile/providers/query-provider.tsx`
- `mobile/features/search/hooks/use-haptic-on-scroll.ts`
- `mobile/features/onboarding/temp/prototypes/scene-01-ember/ember.scene.tsx` (Skia prototype)

# Draft count

**24** files in `draft/` — 16 production snapshots + 8 gap snapshots (tokens, motion, haptics, core components).
