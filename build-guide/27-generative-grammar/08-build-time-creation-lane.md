# Brioela Generative Grammar — Build-Time Creation Lane

## What This File Covers

How AI can still create real `.tsx` components safely: at build time, with review, tests, registry promotion, and EAS/app release controls.

---

## Core Rule

AI can propose components. AI cannot ship components directly to users.

---

## Workflow

1. Product/design identifies a missing primitive or molecule.
2. AI drafts `.tsx`, schema, variants, and examples.
3. Developer reviews and edits.
4. Component gets tests and accessibility checks.
5. Component is added to grammar registry.
6. It ships via normal app release or EAS Update if native runtime is compatible.
7. Runtime AI can start selecting it only after registry deployment.

---

## Component Promotion Checklist

- uses design-system tokens
- uses NativeWind/CVA pattern
- has Zod schema
- has story/test examples
- handles long text
- handles dark mode
- handles reduced motion
- has accessibility labels where needed
- no direct data fetching
- no hidden side effects
- graceful empty state

---

## Registry Policy

Registry is append-first.

Do not remove active primitives abruptly. Deprecate and leave renderer support until all models/prompts stop referencing them.

---

## Creative Benefit

This lane gives us real new UI ideas without runtime risk.

AI can design a new primitive like:

- `sugar_cube_line` (a candidate domain food-data visual)
- `mesa_table_field` (an atmosphere)
- `memory_glow_field` (an atmosphere)
- `recipe_step` (a domain primitive)

But it becomes available only after being built, reviewed, and shipped.

---

## EAS Update Boundary

If the primitive uses only JS/styles/assets compatible with current runtime, EAS Update may ship it.

If it needs native code, new libraries, permissions, or native config, it requires a new app build.
