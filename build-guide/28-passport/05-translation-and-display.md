# Passport — Translation And Display

## What This File Covers

Translation behavior and display modes: show-on-screen, image, PDF, QR link, and text.

---

## Display Modes

```typescript
type PassportShareMode =
  | "show_on_screen"
  | "image"
  | "pdf"
  | "qr_link"
  | "text"
```

Use cases:

- `show_on_screen`: waiter/staff at table
- `image`: send in message or save to photos
- `pdf`: school/caregiver/practitioner handoff
- `qr_link`: restaurant or group context with expiration
- `text`: quick copy/paste

---

## Translation Rules

Translation should preserve food-safety meaning, not literal word order.

Rules:

- translate instruction blocks, not hidden source data
- keep ingredient names clear
- prefer preparation questions over medical jargon
- avoid idioms
- show both languages when useful
- allow user to preview before sharing

---

## Travel Use

Travel Passports can use destination language hints from pre-trip food intelligence.

Example:

```text
English:
I have celiac disease. Please avoid wheat, barley, rye, and shared fryer preparation.

Spanish:
Tengo enfermedad celíaca. Por favor evite trigo, cebada, centeno y preparación en freidora compartida.
```

User should be able to show large text in dim restaurant lighting.

---

## Rendering

Passport uses static, highly legible layout.

Design priorities:

- large type
- high contrast
- no decorative clutter
- clear expiration
- clear severity sections
- Brioela attribution small

Generative Grammar can compose presentation, but cannot change validated instruction content.
