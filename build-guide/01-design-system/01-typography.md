# Typography System

## Overview

Three font families, three distinct roles. Each family is responsible for a specific emotional register and use case. They never bleed into each other's territory.

---

## Font 1 — Display / Emotive
**Cormorant Garamond**
Source: Google Fonts (free, commercial use permitted)
Package: `@expo-google-fonts/cormorant-garamond`

A high-contrast Renaissance serif designed for large-scale display. The extreme stroke contrast — ultra-thin serifs against heavy stems — is what makes it emotive at large sizes. Below 32pt, the hairlines collapse and legibility degrades. That is by design: this font is not a body font. It speaks when something matters.

**Weights to load:**
- Light (300) — long headlines, poetic states
- Regular (400) — default display weight
- SemiBold (600) — assertive display
- Bold (700) — strongest emphasis
- Bold Italic (700i) — emotive peak; the most expressive cut

**Size range:** 32pt minimum. Typical usage: 40pt–96pt.

**Never use for:** body text, labels, UI controls, navigation, anything below 32pt.

---

## Font 2 — UI / Heading / Functional
**Plus Jakarta Sans**
Source: Google Fonts (free, commercial use permitted)
Package: `@expo-google-fonts/plus-jakarta-sans`

Modern geometric grotesque with warmth that the most common grotesques (Inter, Roboto) lack. Full weight axis. High legibility at all sizes from 10pt up. Handles headings, navigation, labels, verdicts, buttons — every piece of UI text that the user acts on or reads for information.

**Weights to load:**
- Regular (400) — body-size UI labels, secondary text
- Medium (500) — default heading weight
- SemiBold (600) — active/selected states, primary labels
- Bold (700) — maximum emphasis in UI context; verdict callouts

**Size range:** 10pt–28pt for standard UI. Goes up to 32pt for section headers.

**Letter spacing rules:**
- Headings (18pt+): `-0.02em` (tighter = more premium feel)
- Body labels (14pt–17pt): `0` (default)
- All-caps tags / categories: `+0.08em` (wider = legibility at small caps)
- Buttons: `0` or `+0.01em`

---

## Font 3 — Body / Reading / Content
**DM Sans**
Source: Google Fonts (free, commercial use permitted)
Package: `@expo-google-fonts/dm-sans`

Humanist sans-serif built for comfortable reading at body sizes. Where Plus Jakarta Sans commands and informs, DM Sans converses. Used wherever the user reads rather than glances: lists, descriptions, long-form content, step-by-step flows. The rounder geometry makes it feel approachable at small sizes.

**Weights to load:**
- Regular (400) — primary reading weight
- Medium (500) — mild emphasis within body text

**Size range:** 13pt–17pt. Line height: always `1.65×` the font size for comfortable reading.

**Never use for:** headings, navigation labels, UI controls. Those belong to Plus Jakarta Sans.

---

## Type Scale

All sizes in points (pt). On React Native these map 1:1 to density-independent pixels.

| Token | Size | Font | Weight | Usage |
|---|---|---|---|---|
| `display-xl` | 96pt | Cormorant Garamond | Bold Italic | Maximum emotive moments |
| `display-lg` | 72pt | Cormorant Garamond | Bold | Large display |
| `display-md` | 56pt | Cormorant Garamond | SemiBold | Mid display |
| `display-sm` | 40pt | Cormorant Garamond | Regular | Minimum emotive size |
| `heading-xl` | 28pt | Plus Jakarta Sans | Bold | Section title, screen title |
| `heading-lg` | 22pt | Plus Jakarta Sans | SemiBold | Card title, modal title |
| `heading-md` | 18pt | Plus Jakarta Sans | Medium | Sub-section header |
| `heading-sm` | 15pt | Plus Jakarta Sans | Medium | Group label |
| `label-lg` | 14pt | Plus Jakarta Sans | SemiBold | Button text, tab labels |
| `label-md` | 13pt | Plus Jakarta Sans | Medium | Chip text, tags |
| `label-sm` | 11pt | Plus Jakarta Sans | SemiBold | Captions, timestamps (all-caps) |
| `body-lg` | 17pt | DM Sans | Regular | Primary reading text |
| `body-md` | 15pt | DM Sans | Regular | Standard body text |
| `body-sm` | 13pt | DM Sans | Regular | Secondary body, supplemental info |

---

## Font Loading Strategy

**Method:** expo-font config plugin — fonts declared in `app.config.ts` under `expo.plugins`. This makes all font families available at app startup with no async loading code in components. No `useFonts()` hook, no flash of unstyled text, no fallback handling in components.

**File format:** OTF preferred over TTF. Smaller file size on iOS, equivalent quality.

**File location:** `assets/fonts/` — all OTF files committed to the repo.

**Config plugin entry (app.config.ts):**
```ts
[
  "expo-font",
  {
    fonts: [
      "./assets/fonts/CormorantGaramond-Light.otf",
      "./assets/fonts/CormorantGaramond-Regular.otf",
      "./assets/fonts/CormorantGaramond-SemiBold.otf",
      "./assets/fonts/CormorantGaramond-Bold.otf",
      "./assets/fonts/CormorantGaramond-BoldItalic.otf",
      "./assets/fonts/PlusJakartaSans-Regular.otf",
      "./assets/fonts/PlusJakartaSans-Medium.otf",
      "./assets/fonts/PlusJakartaSans-SemiBold.otf",
      "./assets/fonts/PlusJakartaSans-Bold.otf",
      "./assets/fonts/DMSans-Regular.otf",
      "./assets/fonts/DMSans-Medium.otf",
    ]
  }
]
```

**Do not use variable font files** — variable fonts are not universally supported across React Native platforms as of 2025. Use static per-weight OTF files only.

---

## NativeWind Usage

Brioela uses NativeWind (Tailwind CSS for React Native). There are no `StyleSheet.create` calls anywhere. All typography is expressed as Tailwind class names.

Font families, sizes, weights, tracking, and leading are all extended in `tailwind.config.ts` to match the type scale above. Components use class names only.

**Font family classes:**
- `font-cormorant` — Cormorant Garamond (display/emotive)
- `font-jakarta` — Plus Jakarta Sans (UI/heading)
- `font-dm` — DM Sans (body/reading)

**Font size classes** (mapped to the type scale in `tailwind.config.ts`):
- `text-display-xl`, `text-display-lg`, `text-display-md`, `text-display-sm`
- `text-heading-xl`, `text-heading-lg`, `text-heading-md`, `text-heading-sm`
- `text-label-lg`, `text-label-md`, `text-label-sm`
- `text-body-lg`, `text-body-md`, `text-body-sm`

**Weight classes:** `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`

**Tracking classes** (extended in config to exact values):
- `tracking-tight` → `-0.02em` (headings)
- `tracking-normal` → `0`
- `tracking-wide` → `+0.05em` (all-caps tags)

**Leading classes:**
- `leading-reading` → `1.65` (body text — extended in config)
- `leading-tight` → `1.2` (display text)

Example in a component:
```tsx
// Display moment
<Text className="font-cormorant text-display-lg font-bold italic text-white leading-tight" />

// UI heading
<Text className="font-jakarta text-heading-lg font-semibold text-white tracking-tight" />

// Body reading
<Text className="font-dm text-body-md font-normal text-secondary leading-reading" />
```

## Usage Rules

- No inline style props for typography anywhere — no `style={{ fontFamily, fontSize, fontWeight }}`. NativeWind className only.
- No arbitrary Tailwind values for typography (`text-[56px]`, `font-[700]`) — use only the named classes from the type scale.
- Line height class must always accompany font size class on reading text — never rely on the OS default.
- Never use `font-cormorant` in UI context — it belongs only in emotive display positions. The definition of "emotive display" is defined per feature in that feature's UI spec, not here.
