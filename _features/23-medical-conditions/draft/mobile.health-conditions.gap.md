# Draft: mobile health-conditions screens (gap — not implemented)

Target: `mobile/app/settings/health-conditions.tsx`, related components

Source: `brioela-specs/34-universal-visual-intake.md`, `build-guide/22-medical-conditions/02-condition-profile-data.md`

---

## Intended UX

### Settings → "What Brioela knows about me" → Medical conditions

Lists active and inactive condition profiles from Brain DO (not Supabase).

**Per condition row:**
- Display name (e.g. "Celiac disease")
- Strictness badge (strict / moderate / standard)
- Active / inactive status
- Tap → detail screen

### Detail screen

- What this changes (scans, recipes, meal ideas)
- Change strictness (when supported)
- Deactivate ("I'm no longer pregnant")
- Delete all data for this condition
- Practitioner notes (if **46** consent + annotations exist)

### User-facing deactivation copy

```text
Stop applying pregnancy-safe food guidelines across scans and recipes?
```

### Delete confirmation

```text
Delete all pregnancy condition data? This removes your profile and condition flag history. Scan history stays unless you delete it separately.
```

## API

`mobile/network/brain/conditions.api.ts` — Brain-backed read/deactivate/delete. No REST to Supabase for condition profiles.

## Scan UI component

`mobile/components/scan/condition-flag-rows.tsx` — renders `conditionFlags[]` below standard verdict, separate from allergy interrupt card.

**Example user-facing flag:**

```text
Celiac flag: contains wheat. Avoid.
```

```text
Hypertension flag: high sodium for a single serving.
```
