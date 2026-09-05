---
name: iOS Swift ref
description: >-
  Use this before placing iOS bars, sheets, or keyboard insets. Fetch live HIG +
  SwiftUI docs this turn. Do not guess 34pt or 120pt. When the product has a
  writing surface: full-bleed editor, last line flush on the composer hairline,
  system TextEditor scrolls itself. When home uses a large title, it sits fully
  below the status bar. Subtitle uses the stock slot, tight with the title.
---
Use this before placing bars, sheets, or keyboard insets on iOS. Pairs with [iOS 26](sand-workflow:ios-26).

Do not guess 34pt / 120pt. Do not invent chrome SwiftUI cannot draw.

## This turn

1. Name the control you are placing (toolbar, sheet, keyboard, composer bar, product surface, large title, large subtitle).
2. Fetch the live HIG page and the SwiftUI page for that control. Quote the title and one rule. Docs win over memory.
3. Place with system APIs: `NavigationStack`, `.toolbar`, `.searchable`, `.sheet` + detents, `safeAreaInset` for a composer bar, system keyboard safe area.
4. The product surface is a view background. Liquid Glass is bars only.

## Appearance

Light / Dark / System is one `@AppStorage` at the **root**. Apply `.preferredColorScheme` on the `WindowGroup` **and** on presented sheets. Do not resolve `UIColor { traits in … }` inside a sheet — `traits.userInterfaceStyle` stays light and Settings ignores Dark. Product surfaces still use their own fills.

## Large-title home

When home uses a large title, fetch HIG + SwiftUI large title this turn. It must sit fully below the status bar. Fail `GREETING_CLIP` if the top of the letters is sliced. Do not hide the nav and homemade-draw it. Custom display fonts still have to fit the large-title slot.

A live subtitle uses the stock `largeSubtitle` / `.subtitle` slot, not a homemade draw under a hidden nav. Tight with the title, same left edge. A 16pt pad under the large title is a miss. The lockup can be Path / ink charm inside that slot. Section headers are list-section charm, not a UIKit caption style. The large title stays type.

## Writing surface (when the product has one)

The editor is not a home card and not a floating postcard.

- The whole editor is the product surface (view background, edge to edge)
- Date, title, and body start from the same origin they already have (do not shift the type block). Do not pin a short page to the bottom at rest
- `TextEditor` is long-form multiline scrollable text (Apple: “display and edit long-form text”). Several paragraphs must fit without clipping
- Let the system `TextEditor` fill the field above the composer bar and scroll itself. Do not park the caret (`ScrollViewReader` `scrollTo`, caret-rect insets, measured-height cap on a scroll-disabled editor). Fail `TEXT_OVERLAP` if new lines paint on top of old ones
- Composer inset stays above the system keyboard, not flush or clipped. Pad is keyboard-only when keys are open. Do not put a 44pt minHeight on the caption
- The current / last line sits flush on the composer hairline (a few points of air). Scroll ends just before the count. Do not add a full extra ruling as clearance
- A style `.sheet` last row must scroll into view
- Ruled / dotted: lock line height to the rule pitch so the baseline sits on the line
- Keyboard-open is part of done. Do not call the editor done from a closed-keyboard shot
- Surface and type travel with `keyboardLayoutGuide` (no snap)

## Refuse

Hard-coded 34 / 120. Hidden nav plus homemade buttons. CSS glass on the product surface. Height-fraction home cards used as the editor. Type floating above ruled lines. Extra ruling as last-line clearance. 44pt minHeight on the composer caption. Pinning short pages to the bottom at rest. Caret park / per-keystroke `scrollTo`. A sliced large title. A 16pt pad under the large title. Homemade-drawn title to host the subtitle. Appearance resolved from `UIColor` traits inside a sheet.
