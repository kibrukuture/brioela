# 006 — `getToolsForSessionType` / `SessionCallerType` — Remove "Type" Padding

## Complaint
`export function getToolsForSessionType(` uses "Type" as a suffix, which is padding — it adds no information. The function gets tools for a session caller; "Type" is noise.

Same complaint applies to `SessionCallerType` — "Type" at the end is a meaningless suffix. The name should describe the domain concept, not annotate that it is a type.

## What Needs to Happen
- Rename `getToolsForSessionType` → `getToolsForSession` (or a clearer verb-noun form).
- Rename `SessionCallerType` → `SessionCaller` (the type annotation is implicit — it's already a TypeScript type).
- Update all call sites and imports.

## Why
Padding like "Type", "Object", "Data", "Info" in identifiers is banned by convention. The identifier should name the concept, not describe its technical category.

## Status
Open — not yet fixed.
