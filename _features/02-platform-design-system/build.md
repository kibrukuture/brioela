# Platform Design System — Build

Feature **02**. Mobile design tokens, shared components, Skia layers, theme wiring, and evidence-first UI primitives under `mobile/design-system/` and `mobile/components/`.

---

## Build order (within feature)

Implement in this sequence — each layer depends on the previous:

1. **Tokens + Tailwind** — `colors.ts`, `typography.ts`, `spacing.ts`, `global.css`, `tailwind.config.ts` semantic extensions.
2. **Motion + haptics** — `motion.ts`, `haptics.ts` (settings toggle wired).
3. **CVA variants** — `variants/button`, `card`, `tag`, `badge`, `icon-button`, barrel `index.ts`.
4. **Shaders** — `shaders/ambient.glsl.ts`, `texture.glsl.ts`, `holographic.glsl.ts`; map pulse shaders referenced by **27**/**28**.
5. **Core components** — Button, GlassCard, VerdictField, GlowRing, AmbientCanvas, Icon (NavIcon pattern), EmptyState, BreathContainer.
6. **Root integration** — mount `AmbientCanvas` in `app/_layout.tsx`; font config plugin; cream splash `#F8F6F2`.
7. **Loading patterns** — Breath, Presence slot helper, GlassSweep, Skia ring spinner (single permitted case).
8. **Static generative fallbacks** — template components for **52**/**51** (scan verdict static, discovery card static).
9. **Shell alignment** — Brioela tab routes (defer full route migration to product features; stub tab icons with Phosphor).

---

## Package dependencies (`mobile/package.json`)

Already installed (use, do not duplicate):

| Package | Role |
|---|---|
| `nativewind`, `tailwindcss` | All styling |
| `class-variance-authority`, `clsx`, `tailwind-merge` | CVA + `cn()` |
| `@shopify/react-native-skia` | GPU layers |
| `react-native-reanimated`, `moti` | Motion |
| `expo-haptics` | Haptics |
| `expo-font` | Font loading |
| `phosphor-react-native` | Icons |
| `usehooks-ts` | Effect hooks |

Add when implementing typography spec:

| Package / asset | Role |
|---|---|
| OTF files in `assets/fonts/` | Cormorant Garamond, Plus Jakarta Sans, DM Sans (per weight) |
| Optional: remove `@expo-google-fonts/inter` | After Jakarta migration |

**Policy conflicts to resolve during build:**

| Package | Spec | Production | Action |
|---|---|---|---|
| `phosphor-react-native` | Only icon lib | + lucide, roninoss, vector-icons | Remove usages outside design-system migration PRs |
| `react-native-paper` | Not listed | PaperProvider in root | Remove or isolate to legacy Schnl screens |
| `moti` | Simple declarative springs | Installed, unused | Use per motion spec or remove |

Banned per `11-packages.md`: styling via `StyleSheet.create` in new code; axios (mobile network — **01** gap).

---

## File map — tokens (`mobile/design-system/`)

| File | Role | Status |
|---|---|---|
| `colors.ts` | Primitives + semantic + verdict bloom helpers | **Gap** — see `draft/design-system.colors.gap.md` |
| `typography.ts` | Type scale constants (pt sizes, tracking) | **Not in repo** |
| `spacing.ts` | 4pt scale + layout constants + grammar ordinal map | **Not in repo** |
| `motion.ts` | Named spring configs + verdict springs | **Gap** — `draft/design-system.motion.gap.md` |
| `haptics.ts` | Semantic haptic wrapper + prefs toggle | **Gap** — `draft/design-system.haptics.gap.md` |
| `variants/button.variants.ts` | CVA button | **Gap** |
| `variants/card.variants.ts` | CVA card + verdict compound variants | **Not in repo** |
| `variants/tag.variants.ts` | Verdict tags | **Not in repo** |
| `variants/index.ts` | Barrel | **Not in repo** |
| `shaders/ambient.glsl.ts` | Layer 1 SkSL | **Not in repo** |
| `shaders/texture.glsl.ts` | Grain SkSL | **Not in repo** |
| `shaders/holographic.glsl.ts` | Layer 5 SkSL | **Not in repo** |
| `shaders/ground-pulse.glsl.ts` | Ground map dots (**27**) | **Not in repo** |
| `shaders/map-place-pulse.glsl.ts` | Healthy map dots (**28**) | **Not in repo** |

---

## File map — shared components (`mobile/components/`)

| Component | Role | Status |
|---|---|---|
| `Button/` | Primary CVA button + haptic | **Gap** |
| `GlassCard/` | Layer 3 liquid glass | **Gap** — `draft/glass.card.gap.md` |
| `VerdictField/` | Verdict bloom wrapper | **Gap** |
| `GlowRing/` | Layer 2 scan ring | **Gap** |
| `AmbientCanvas/` | Layer 1 root ambient + texture | **Gap** |
| `Icon/NavIcon.tsx` | Phosphor active/inactive crossfade | **Not in repo** |
| `EmptyState/` | Cormorant + one action | **Not in repo** |
| `BreathContainer/` | Loading pattern 1 | **Not in repo** |

**Shipped (legacy — not design-system spec):**

| Path | Notes |
|---|---|
| `components/ui/back-button.tsx` | Lucide + raw hex + `neutral-*` — anti-pattern |
| `components/ui/theme-toggle.tsx` | RoninOSS icons; works with NativeWind dark mode |
| `components/ui/sheet.tsx`, `sheet-provider.tsx` | Bottom sheet shell |
| `components/ui/otp-code-field.tsx` | Auth (**03**) |

---

## File map — theme + config

| File | Role | Status |
|---|---|---|
| `global.css` | CSS variables for NativeWind | **Shipped** — Schnl palette; snapshot `draft/global.css.md` |
| `tailwind.config.js` | Tailwind extend | **Shipped** — Inter fonts, shadcn colors; `draft/tailwind.config.js.md` |
| `theme/colors.ts` | Imperative colors for icons/nav | **Shipped** — iOS/Android system; `draft/theme.colors.md` |
| `theme/index.ts` | Expo Router NAV_THEME | **Shipped** — `draft/theme.index.md` |
| `lib/cn.ts` | clsx + tailwind-merge | **Shipped** — matches spec |
| `lib/useColorScheme.tsx` | NativeWind dark mode toggle | **Shipped** |
| `app/_layout.tsx` | Root providers | **Shipped** — Schnl stack; no AmbientCanvas |
| `app/tabs/_layout.tsx` | Tab shell | **Shipped** — banking tabs |
| `nativewind-env.d.ts` | Types | **Shipped** |
| `app.json` | Expo config | **Shipped** — white splash, Inter/parafina fonts |

Target after **02**: replace `theme/colors.ts` consumption with `design-system/colors.ts` semantic exports; extend `tailwind.config` with Brioela tokens; update `global.css` to warm cream semantic variables per `02-color-system.md`.

---

## Font assets (`mobile/assets/fonts/`)

Spec requires OTF (not variable fonts):

- Cormorant Garamond: Light, Regular, SemiBold, Bold, Bold Italic
- Plus Jakarta Sans: Regular, Medium, SemiBold, Bold
- DM Sans: Regular, Medium

**Shipped:** `parafina_black.ttf` only (+ Inter via google-fonts package).

---

## Root layout changes (acceptance)

When complete, `app/_layout.tsx` must:

- [ ] Mount `AmbientCanvas` once at root (pointerEvents none).
- [ ] Load fonts via expo-font **plugin** in `app.json` (remove blocking `useFonts` or keep only for migration).
- [ ] `SystemUI.setBackgroundColorAsync('#F8F6F2')` light / near-black dark.
- [ ] Expose ambient intensity context for empty states.
- [ ] Remove or gate `PaperProvider` if not required for Brioela product screens.

---

## Acceptance criteria

### Tokens
- [ ] `mobile/design-system/colors.ts` exports primitives + semantic light/dark + verdict bloom helpers.
- [ ] `global.css` + `tailwind.config` use Brioela semantic names (`bg-bg-primary`, `text-text-secondary`, `accent-primary`, …).
- [ ] No arbitrary color classes (`text-[#…]`, `neutral-*`, default Tailwind palette) in new Brioela product code.
- [ ] Typography scale available as NativeWind classes; three font families loaded.

### Components
- [ ] Button, GlassCard, VerdictField, GlowRing, AmbientCanvas ship with CVA + tests where non-trivial.
- [ ] All design-system components use `haptic.*` and `spring.*` — no inline configs.
- [ ] Phosphor-only in new shared components.

### Motion / accessibility
- [ ] `useReduceMotion()` honored on springs and ambient amplitude.
- [ ] Verdict bloom + matching `haptic.verdict.*` fire same frame.

### Loading / empty
- [ ] Breath, Presence, GlassSweep implemented; no `ActivityIndicator` in product paths.
- [ ] Empty state uses Cormorant display-sm + one action.

### Integration
- [ ] **52** can import token/motion/haptic modules from `@/design-system/*`.
- [ ] **51** static Discovery Card template renders without grammar document.
- [ ] **24** scan UI spec can compose GlowRing + VerdictField (feature **24** still owns verdict data).

### Legacy cleanup (incremental — not blocking first token PR)
- [ ] StyleSheet files migrated or quarantined to Schnl legacy folder.
- [ ] Lucide/RoninOSS removed from touched Brioela screens.

---

## Not in this feature

| Area | Owner feature |
|---|---|
| Generative grammar runtime, Zod document schema | **52** |
| Discovery Card scrub/consent, share flow | **51** |
| Scanner verdict logic, API | **24** |
| Map/Ground feature UI wiring | **27**, **28** |
| Auth screen flows | **03** |
| Monorepo / network client | **01** |

---

## Draft folder

**24** files in `draft/`:

- **16** production snapshots (`global.css`, `tailwind.config.js`, theme, layout, tabs, ui samples, package.json, app.json, haptic hook).
- **8** gap snapshots (colors, motion, haptics, AmbientCanvas, GlassCard, GlowRing, button variants, VerdictField).

See count in `status.md`.

---

## Downstream feature build references

These `_features/` build guides name paths under `mobile/design-system/`:

- `_features/27-ground/build.md` — `ground-pulse.glsl.ts`
- `_features/28-map/build.md` — `map-place-pulse.glsl.ts`, healthy signal layer
- `_features/52-generative-grammar/build.md` — consumes tokens; static fallback templates
- `_features/51-viral-sharing/build.md` — Discovery Card design-system templates

Implement **02** token + Skia base before Layer 4 map components in **27**/**28**.
