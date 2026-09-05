---
name: Just works
description: >-
  Use this on any accepted work, not only apps. Load this file when there is a
  job. Naming it is not a load. Always: finished, proof this turn, no stubs,
  user-facing result exists. Screens add a picture. iOS ships add Mini sim. This
  short path is the product system. A 12-gate FEATURE packet is not a load.
---
Anything we do has to actually work. Open this file when there is a job, not only an app. Naming it is not a load. Next gate only.

This file is the **product system**. On conflict with a 12-stage pipeline, a FEATURE.md packet, or yaml `just_works:` / `load:` stamps, this recipe wins.

## When

Any accepted work: a screen, a dashboard, a game, 3D, sprites, art, a favicon, a ship, a skill, a Notion page, a Mini sim, a copy rewrite, a dark mode, a TestFlight. Detect. Do not wait for `/just-works` or the word ship.

Skip filler status. [Grok Bot efficiency](sand-workflow:grok-bot-efficiency) stays cheap. Do not dump iOS insets on a skill-sync turn. Cheap is not a one-line stamp to the user.

## Load

1. Read this file.
2. Talk like a person. Restate the job in ordinary English: what it is, how they’d use it. Wait. A stamp (“nod? gate: threejs”) is a miss. Short load ≠ short talk.
3. Take **one** next gate, not the whole stack. A dashboard with sprites is two gates (look, then assets), not a mega-merge:
   - Pixels / copy / slop → [UI thrift](sand-workflow:ui-thrift). Visual product: lock 3–5 shipped refs first ([Brief to references](sand-workflow:brief-to-references))
   - iOS chrome / editor / greeting → [iOS 26](sand-workflow:ios-26)
   - Icons / SVG / small motion (after the bar) → ui-marks
   - Favicon / PWA / share card → og (non-blocking; do not wait)
   - Stills / video art → imagine (not chrome; not exact type or numbers)
   - Sprites / tiles / HUD / maps → game-asset-core, then the specialist
   - 3D / WebGL → threejs. Loop / camera / WASD → building-games + controls
   - Auth → auth. Database → neon. Only when asked
   - Proof command → [Verify done](sand-workflow:verify-done)
   - Finish the accepted steps → [Unlazy](sand-workflow:unlazy)
   - iOS ship → [Sim confirm](sand-workflow:sim-confirm) then [Prototype to TestFlight](sand-workflow:prototype-to-testflight)
   - Web ship → [Ship motion](sand-workflow:ship-motion)
4. Have proof this turn before saying it works.

Suggest the next interaction from a picture, one or two, like a person. Do not brainstorm a list before pixels.

Do not print `loaded: yes`, `just_works:` yaml, or `load:` yaml in the user chat. Load is a Read of this file this turn. A stamp without that Read is not a load.

Do not run a 12-stage pipeline. Do not stamp FEATURE.md as a load of this skill. `depth=quick` does not skip proof. Do not Imagine the UI. `design-ui` is a kit, not this path.

## Bar

All four, or it is not done.

1. The accepted job finished. No stub, no TODO, no “you can wire this”
2. Proof this turn (a command, a picture, a live page, a `delivery-uuid`). Not a plan. Not last session
3. The empty / error / fail path is real, not a placeholder
4. The user-facing result exists (the page, the build, the skill copy, the screen)

A thin first pass is fine. The bar still applies to what shipped.

## If it is a screen

Look at a picture this turn. Empty is the product (**Empty**, not poetry, not a 0-word Untitled card). Run pictures through thrift (fonts, sample copy, fibre pinstripe, gray Notes dark, cream-on-cream chrome, default Palatino/Georgia on cream).

Keepers are screens of the job’s surface. Look is the feel of a usable page. Do not draw the metaphor in CSS.

User-visible state changes **move**. Snap is a miss. Delete, pin, unpin, focus, undo, first-run open, first-run exit into home, and other list/sheet mutations match that family. Reduce Motion is instant. Fail a mutation that jumps, chrome that pops, or a welcome that cuts to home. Confirm-to-delete is still a miss.

First-run open is a **product event** that owns the screen (the surface arrives, then the mark lands). Not a bigger logo. Lessons show the product in use, not blank frames.

## If it is an iOS ship

Mini sim this turn. `linux-hammer` is not a launch pass. Also fail: `KB_COVER`, `TEXT_OVERLAP`, `GREETING_CLIP`, confirm-to-delete, a snap where motion should be (pin, focus, delete, undo, first-run exit), `STORE_MIGRATE`, listing-only name, web wrap, Notes clone, system-gray dark, cream-on-cream Dark buttons.

A `delivery-uuid` or altool `VALID` is not the ship. The user-facing result is the build **on the Internal group** with `internalBuildState` **IN_BETA_TESTING**, installable in TestFlight. VALID with `MISSING_EXPORT_COMPLIANCE` still shows the old build. Fail that this turn.

## Input

Ordinary English is enough. Never ask the user to speak fail codes.
