---
name: Sim confirm
description: >-
  Use this to prove an iOS app on Simulator before TestFlight. A green
  xcodebuild or linux-hammer is not proof. Pixels plus a user-shaped interaction
  plus a looked-at screenshot after each step are. For an editor, keyboard-open
  must show the last line flush on the composer hairline. For a large-title
  home, the title must sit fully below the status bar. Subtitle and section
  headers are product charm, not SF. Do not hang on simctl ui appearance,
  terminate, or spawn.
---
Build success is not confirmation. Pixels + a user-shaped interaction + a looked-at screenshot after each step are. Required before Internal TestFlight.

## Intent first

Write 3–8 observable checks from the lock or brief. Do not invent a pass from logs. When the store schema changed, one check is: app opens on an **old** data store (rows from the previous build). When a store name was locked, one check is the home-screen / springboard label. When the surface is an editor, one check is **keyboard-open**: last / current line fully visible and flush on the composer hairline (not sliced, not 2–3 empty rules above the count). A shot that only proves the keyboard is showing is not that check. Another editor check is **wrap while typing**: new lines must not paint on top of old ones. A still of sample text is not that check. On a large-title home, first paint: the title sits fully below the status bar. Fail `GREETING_CLIP` if the top of the letters is sliced.

On home, also look at the subtitle and section headers. They are live product marks in stock slots, not SF caption and not a frozen bitmap. Tight with the large title, same left edge. Large title stays type. Fail a homemade-drawn title.

When dark mode shipped this turn, one check is **light and dark**. Product night, product surfaces keep their fills, title readable. Empty mark is not pinstriped. Empty headline is **Empty**. Dark chrome has contrast, not cream-on-cream. One tap in Settings Light/Dark retints home **and** Settings.

When welcome shipped this turn: first-open after uninstall is the product event owning the screen, then lessons that show content (not blank frames, not home). Do not set a debug flag that skips first-run. Last welcome page **moves** into home; a cut is a miss. Skip from the opening beat still works. Settings this ship: Appearance tiles retint home **and** Settings the same tap. Import shows official third-party icons and says Import.

## Loop

1. Discover the project, scheme, bundle id, and a booted simulator
2. Build and run on that simulator
3. Wait for first paint, screenshot, and **read the image**
4. Act like a user against the intent list (home, new item, type wrapping lines with keyboard open, style sheet, share, delete)
5. After every gesture: new screenshot, read it, tick or fail that check
6. PASS only if every intent check is evidenced by a looked-at frame

The product’s native worktree lives in memory, not here. Do not checkout a second branch in an old clone (worktree conflict).

`SIMCTL_CHILD_FOO=1 xcrun simctl launch`. Never `launch --setenv`.

## Illegal

- PASS from compile / install / pid alone
- PASS from `linux-hammer` or a CloudAgent worker (it has no Simulator)
- Screenshot captured but not opened
- Shipping TestFlight before this loop
- Treating TestFlight / a physical phone as a substitute for this loop (phone is extra)
- Claiming a Linux worker ran Simulator
- Calling the editor done from a closed-keyboard shot, or from a keyboard-open shot where the last line is sliced or two empty rules above the count
- Claiming wrap-while-typing from a still of sample text
- Hanging on `simctl ui send-text`, `simctl ui appearance`, `simctl help`, `simctl terminate`, or `simctl spawn`. `io screenshot`, `launch`, and `ui appearance` often need **~20s**. Timeout ~20s then killpg. A 6s kill is a false hang. Host `kill -9` the app. osascript keystroke paste is blocked. If you cannot type or flip appearance on the ship Mac, say so. Do not invent a wrap or dark pass.
- Calling home done when the large title is sliced by the status bar
- Calling home done when subtitle or section headers are SF chrome or a frozen bitmap
- Calling welcome done when first paint is home
- Calling Dark chrome done when a primary button is cream-on-cream
