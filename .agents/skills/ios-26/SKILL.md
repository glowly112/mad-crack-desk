---
name: iOS 26
description: >-
  Use this whenever an iOS app is being built or reviewed. Native chrome is
  required. Product charm is required. When the product has a writing surface:
  full-bleed editor, keyboard-open, last line flush on the composer hairline,
  paper (not white) beside the keyboard. When home uses a large title, it sits
  fully below the status bar. Subtitle and section headers are product charm in
  stock slots, not SF. Dark: chrome follows the scheme, product surfaces keep
  their fills.
---
Part of [Just works](sand-workflow:just-works) when the surface is iOS. Native chrome is required. The product’s [UI thrift](sand-workflow:ui-thrift) look is also required. One without the other is a prototype.

Does not replace thrift for pixels or [Prototype to TestFlight](sand-workflow:prototype-to-testflight) for signing.

Two jobs: (1) a web prototype should look like iOS 26 so a later SwiftUI port is not a different app. (2) native uses real system chrome.

## When

Building, reviewing, or shipping an iPhone / iPad app. Auto-load. Do not wait for `/ios-26`.

## Split (do not collapse)

| Layer | Owner | Steal from |
| --- | --- | --- |
| Chrome | this skill | iOS 26 system (Notes, Journal, Settings) and Mobbin chrome screens |
| Charm | [UI thrift](sand-workflow:ui-thrift) | the product’s own shipped screens, then locked refs (type, colour, voice, surfaces) |

Chrome = how you move: back, search, compose, share, sheets, alerts, Liquid Glass on bars only.
Charm = what you are looking at: the page, the type, the product surface.

Do not Notes-ify the product. Do not HTML-ify the chrome. Do not guess bar, sheet, or keyboard inset numbers. Load [iOS Swift ref](sand-workflow:ios-swift-ref) before placing those.

## Writing surface (when the product has one)

The editor is not a home card.

- The whole editor is the product surface (view background, edge to edge). Not a card on a frame
- Date, title, and body start from the same origin they already have. Do not shift the type block. Do not pin a short page to the bottom at rest
- Type must hold several paragraphs without clipping
- Ruled / dotted: type baseline sits on the rule. Line height matches rule pitch
- Composer / word-count inset stays above the keyboard. Pad is **keyboard-only** when keys are open (do not add the home-indicator). Do not put a 44pt minHeight on the caption. A style sheet keeps its last rows reachable
- The current / last line sits **flush on the composer hairline** (a few points of air). Scroll ends just before the count. Fail if the hairline slices glyphs, or if 2–3 empty rulings sit between last ink and the count. Do not add a full extra ruling as clearance
- Keyboard-open is required. Do not call the editor done from a closed-keyboard shot
- The surface fills **beside** the keyboard too. Text travels with `keyboardLayoutGuide` (no snap from jumping safe-area). A floating or inset keyboard must not leave white / system gutters at the left or right. Fail `KB_COVER`
- Let the system `TextEditor` fill the field above the composer bar and scroll itself. Do not park the caret (`ScrollViewReader` `scrollTo`, caret-rect insets, measured-height cap on a scroll-disabled editor). That froze content offset so new lines painted on top of old ones. Fail `TEXT_OVERLAP`

## Large-title home (when the product has one)

The large title is charm in the system slot. It must sit **fully below the status bar**. Fail `GREETING_CLIP` if the top of the letters is sliced by the Dynamic Island or status bar. Do not hide the nav and homemade-draw the title. Do not guess 34pt. Fetch [iOS Swift ref](sand-workflow:ios-swift-ref) this turn.

## Home subtitle and section headers

Charm in stock slots. Not SF chrome.

- A live subtitle lives in the stock `largeSubtitle` / `.subtitle` slot, tight with the large title (same left edge). A 16pt pad under the large title is a miss. Live values, not a frozen bitmap, not a second title. VoiceOver still gets the spoken line via `navigationSubtitle`.
- Section headers (Pinned, Recents, and the like) are product marks in the list-section slot, not tracked SF all-caps.
- The large title stays type in the stock slot. Do not homemade-draw it to fit a lockup.

## Dark

Follow system appearance. A Light / Dark / System picker is in scope when they ask. Chrome (search, compose, nav, sheets, Settings) follows the chosen scheme **this tap** — home, editor, welcome, Settings, other sheets, one `@AppStorage` at the root, `.preferredColorScheme` on the window **and** the sheets. Do not resolve `UIColor` traits inside a sheet (that stayed light). Product surfaces keep their fills. Dark is the product’s night, not iOS system gray. Empty copy inverts so it stays readable. Dark capsules: contrasting fill and label. Fail cream-on-cream. Prove light **and** dark on Simulator.

## First-run (any app)

Full-bleed root, not a sheet over the live home. Do not put the app name on it unless they asked. Do not use a metaphor they rejected.

Opening is a **product event** that owns the screen (the surface arrives, then the mark lands). Not a bigger logo. Copy types on. Last page **moves** into home (same spring as delete). Root-swap snap is a miss. Reduce Motion is instant.

Lessons **teach the product in use** with the real UI: home with content, the main task happening, Import if the product has it. Not blank frames. Not Mesh, name-capture, paywall, or poetry.

One gate on UserDefaults (or the product store). Do not skip first-open from drifting `@AppStorage` copies. Replay: write the flag **then** dismiss. A debug flag that opens a later screen hides first-run — do not set it on a welcome pass.

## Settings (any app)

The product’s settings entry. A few jobs, not a junk drawer:

- Appearance: System / Light / Dark when they ask. One tap retints the whole app (home, editor, welcome, Settings, other sheets)
- First-run replay toggle if welcome shipped
- Import / connections if the product brings files in: **Import** not Bring in. Official third-party app icons, not SF glyphs. File picker on the phone. No invented OAuth / live sync / accounts

Settings chrome follows the scheme. Product surfaces keep their fills.

## Porting an existing product

If the product already ships (web, TestFlight, or prior iOS), those screens are the charm keepers. Notes / Journal / Mobbin lock chrome only: where search sits, how compose is a system control, how a sheet opens.

Map each product route to two files before pixels:

- Charm: the product’s own home / editor / style shot
- Chrome: one iOS 26 system or Mobbin shot of the same *job* (search, compose, sheet)

A cloud agent gets those image files. It does not get “make it like Notes.” Notes as the visual target for the product face fails.

Web and Swift should share structure, spacing, type scale, and surfaces. If the proto needs a control SwiftUI cannot draw, do not ship it on the web either.

## Native

- iOS 26 SDK (27 when Xcode has it). SwiftUI `NavigationStack`, `.toolbar`, `.searchable`, `.sheet`, `safeAreaInset` for a composer bar
- Stock controls. No hidden nav + homemade buttons
- The product surface is a view background, not a `.toolbarBackground` hack. It ignores container **and** keyboard safe area so the surface, not white, sits in the keyboard gutters
- Keyboard uses the system keyboard safe area. Do not hard-code 34 or 120
- No WKWebView wrap unless they ask
- Green `xcodebuild` is not a visual pass. Keyboard on a phone is. Prove on Simulator ([Sim confirm](sand-workflow:sim-confirm))

## Bar (all, or it is a prototype)

1. SwiftUI (or UIKit) compiled against the iOS 26 SDK
2. Stock chrome: `NavigationStack` or `TabView`, `.toolbar`, `.searchable`, `.sheet`, `Menu`, `ShareLink`, system alerts
3. Liquid Glass from those system controls, bars only. Do not hide the nav bar and draw web buttons. Do not fake glass with custom blur
4. Product charm survives: type, colour, voice, and composition from the product’s own screens. A generic Notes list that drops the product face fails
5. First-tap is a thumb-sized *system* control. The product can still look like itself around it
6. If there is a writing surface: keyboard open is part of done (`KB_COVER` fails). Surface, not white, at the keyboard sides. Last line flush on the composer hairline
7. No Capacitor / WKWebView wrap unless they explicitly ask
8. Prove on Simulator. A green `xcodebuild` is not a visual pass
9. If home uses a large title: fully visible. Fail `GREETING_CLIP`
10. Home subtitle and section headers are product charm in stock slots, not SF

## Forbid

- Wrapping a Vercel URL
- Custom compose pills that replace system compose
- Emoji nav icons
- Shipping iOS 26 chrome with SF / Inter as the product face when a named face was in scope
- Shipping the web card wall *as* the iOS shell, or shipping a Notes clone that lost the product face
- Using Notes, Journal, or a Mobbin app as the home / editor look when the product already has those screens
- Guessed 34pt / 120pt keyboard or home-indicator gaps
- Treating the editor as a home card / height-fraction postcard
- Type floating above ruled lines
- White or system background showing at the sides of the keyboard
- Extra ruling as last-line clearance
- 44pt minHeight on the composer caption
- Pinning short pages to the bottom at rest
- Caret park / per-keystroke `scrollTo` / lagged `frame(height:)` on a scroll-disabled `TextEditor`
- A sliced large title (`GREETING_CLIP`)
- Homemade-drawn large title (hide the nav to paint it)
- SF / Inter as the home subtitle or section header when a product face was in scope
- Frozen date bitmap, or a 16pt pad under the large title
- Tracked SF all-caps section headers
- Near-vertical texture that reads as pinstripe
- Dark mode as system gray Notes
- Welcome as a sheet over the live home
- Blank welcome frames
- Settings chrome that ignores Dark
- Bring in (the word is Import)
- SF glyphs where official app icons exist
- App name or rejected metaphor copy on welcome
- A bigger logo instead of a product event
- Welcome that snaps to home
- Cream-on-cream Dark chrome
- First-open that skips welcome while the seen flag is absent

