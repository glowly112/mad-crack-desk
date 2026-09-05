---
name: One UI factory
description: >-
  Use this when one-shotting or reviewing UI for web, desktop, or iOS. One
  factory line: gate, thrift, tokens, compose, adapt, craft, critique, verify
  the running UI. Slop (generated copy, default-agent look, fibre pinstripe,
  gray dark) is caught here with UI thrift.
---
# One UI factory

Same line on web, desktop, and iOS. Platform only changes Adapt and Verify. Five roles: Foreman (gate), Librarian (inventory + tokens), Art director (exception only), Craft (quality + critique), Verifier (running UI).

Do not invent a second process per platform. Do not add extra roles.

## 1. Gate (Foreman)

Write before any pixels or components:

- User and job
- Current vs desired
- Success signal
- Non-goals
- Platforms in scope
- What “done” means

Stop if any are missing. If the request is “build X” but the job is unverified, verify the job once here, then continue. Do not open a design file or invent a component in this step.

## 2. Inventory (Librarian)

Search existing tokens, components, patterns, and prior screens in the repo and in the design file if one exists. Output a reuse list and explicit gaps. Prefer existing even if slightly imperfect.

## 3. Bind tokens

Map color, type, space, radius, and motion to semantic names (roles), not hex or magic numbers. If a name is missing, add one token. Do not hardcode. One token source; platforms consume transforms.

## 4. Compose

Build token → atom → molecule → organism → screen with real content.

Figma, if present:

- A frame is the spec. Implement it. Do not also invent a new look.
- No frame: generate one frame from the brief, or invent in code. Not both.
- Treat design-to-code output as a reference. Rebuild in this repo’s stack. Reuse mapped components and tokens first.

Art director is a **branch at steps 2–3**, not a later step. Fire it only when inventory is empty and a new decision is required. If it fires every time, inventory failed.

Avoid default agent looks: generic Inter + purple gradient, identical cards, empty-state illustrations that mean nothing, generated journal sample copy, typeface chips, near-vertical fibre that reads as pinstripe, system-gray “dark mode” that Notes-ifies a product, cream-on-cream Dark chrome, Mesh/name-capture welcome, a bigger logo instead of a product event.

## 5. Adapt (not redesign)

Swap only chrome:

| Concern | Web | Desktop | iOS |
|---|---|---|---|
| Nav | App IA | Window, menu, sidebar | Tab bar / nav stack |
| Focus | `:focus-visible` | Keyboard + OS focus | Focus / VoiceOver |
| Pointer | Hover + click | Hover + click | Touch; hover is not required |
| Motion | `prefers-reduced-motion` | OS setting | Reduce Motion |
| Verify | Browser | Running desk app | Simulator |

Do not fork the token layer or the look.

## 6. Craft

Fill reachable states: empty, loading, error, disabled, focus, destructive. Spacing on the scale. Contrast, visible focus, name/role/value, target size. No decorative novelty.

Empty copy is product voice. One word is enough (**Empty**). Sample content should sound like a person (a name, a list), not a generated journal.

## 7. Critique

Against the gate only. Rewrite taste (“too red”) as a goal failure. Severity: High / Medium / Low. Fix High before calling it done.

## 8. Verify

Drive the **running** UI with the platform tool. Screenshot or interact. Do not pass from code or from a design screenshot alone. Fix High/Medium. Loop 6–8 until those are gone.

On iOS, if dark mode shipped this turn, look at light **and** dark. Product night, product surfaces keep their fills. Dark chrome has contrast.

## Don’t

Do not skip Gate. Do not invent a second factory. Do not call it done from Figma. Slop lives here with [UI thrift](sand-workflow:ui-thrift).
