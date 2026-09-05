---
name: Hammer
description: >-
  Use this before shipping a feature. 5–8 glare cases that would have made the
  bug obvious in the first minute. On mobile, include keyboard, last line vs
  composer hairline, wrap-while-typing, sheet last row, ruled baselines, white
  gutters beside the keyboard, an old-store open after a schema change, a
  large-title home that is not clipped, subtitle and section headers as product
  charm not SF, empty copy that is Empty not poetry, no fibre pinstripe, and
  product night if dark shipped.
---
Tests that would have made the bug obvious in the first minute. Cap 8. Pair with [Verify done](sand-workflow:verify-done) so the list actually ran.

## Default glare list

1. Empty / missing input
2. Invalid shape
3. Double submit / retry / back
4. Stale / expired / hold timeout
5. Offline / 5xx
6. Empty list / first-run
7. Last known bug on this surface
8. The accepted done case

## Mobile (required when there is a field or sheet)

Keyboard height is not the safe-area inset and not the full viewport.

- Caret and the line being typed stay above the keyboard
- Last / current line is fully visible and **flush on the composer hairline** (a few points of air). Fail if the hairline slices glyphs, or if 2–3 empty rulings sit between last ink and the count
- Composer inset stays above the keyboard. Pad is keyboard-only when keys are open (do not add the home-indicator). Do not put a 44pt minHeight on the caption
- Text travels with the keyboard guide (no snap from jumping safe-area)
- Sheet last section stays reachable
- Composer / FAB uses the visual viewport plus safe area, not a guessed 34px
- Dismiss / rotate does not leave stuck padding
- Ruled / dotted: type baseline sits on the rule
- Product surface, not white, at the left and right of the keyboard
- Type wrapping lines with the keyboard open. Fail if new glyphs paint on top of old lines. Dismiss-keyboard cleaning the page is the tell. Fail code: `TEXT_OVERLAP`
- Do not park the caret (`ScrollViewReader` `scrollTo`, caret-rect insets, measured-height cap on a scroll-disabled `TextEditor`). Let the system `TextEditor` fill the field above the composer bar and scroll itself
- First-paint large-title home: the title sits fully below the status bar (empty and with content). Fail `GREETING_CLIP` if the top of the letters is sliced
- Empty headline is **Empty**, not poetry. Empty mark is not pinstriped. A 0-word Untitled card is not a populated home
- Home cards: date is quiet meta, not a second headline. No typeface chips. No duplicate dates
- Home subtitle is a live product lockup in the stock slot, not SF chrome and not a frozen bitmap. Section headers are product marks, not tracked SF caps. Large title stays type. Subtitle sits tight with the title, same left edge (a 16pt pad under the title is a miss)
- Dark this ship: product night, product surfaces readable, title readable. Fail system-gray Notes. Fail cream-on-cream Dark chrome. One tap Light/Dark retints home **and** Settings
- Welcome this ship: first-open after uninstall is the product event, not home. Lessons show content (not blank frames). Last page moves into home. No app name unless they asked. No rejected metaphor copy. Dark capsule has contrast. Settings Appearance retints home and Settings. Import says Import and uses official app marks

Fail code: `KB_COVER`.

## Schema / store (required when a model field was added)

Open the app against a store from the previous build. Existing rows must load. A new required field without a default is a launch crash.

Fail code: `STORE_MIGRATE`.

## Name (required when they locked a store name)

Home-screen display name matches the locked listing name this ship. Listing-only is a miss.
