---
name: Prototype to TestFlight
description: >-
  Use this when taking a GitHub/Vercel web prototype to Internal TestFlight on
  the Mac that has Xcode. CloudAgent writes code. Simulator confirm first. Then
  archive once, export/upload. After a ship, update the product Notion page the
  same turn. The product’s native worktree lives in memory, not here.
---
Get a public web prototype onto Internal TestFlight without the live-`xcodebuild` nightmare.

## Locks

- Internal TestFlight only. Do not submit App Review.
- Do not wrap a login-walled Vercel URL. Bundle a local production build (Capacitor / WKWebView) or a native editor.
- Do not put keychain passwords, `.p8` contents, issuer secrets, or API key IDs in this skill, memory, or chat.
- Do not force-push `main`. iOS work goes on a branch + PR.
- CloudAgent writes the iOS project. The ship Mac archives/exports/uploads.
- Never use extra keychains (`pk_vnext` / `ci` / `devbuild`). Dist certs there hang codesign. Use **login** only.
- Ship-Mac local-exec: ListMachines UUID, never the hostname label.
- After a ship (or a hard fail), update that product’s Notion page the same turn.
- Skill edits: [Skill sync](sand-workflow:skill-sync) the same turn.

## Gate before archive

Do not archive or upload until [Sim confirm](sand-workflow:sim-confirm) passed on the ship Mac **this turn**. `linux-hammer` and a green CloudAgent are not a launch pass.

If the model gained a field (SwiftData / Core Data), prove an **old store** opens. Existing rows must survive. Fail code: `STORE_MIGRATE`. `fatalError` on `ModelContainer` is a crash, not a log.

If they locked a store name, the home-screen display name (`CFBundleDisplayName`) goes in the **same** ship. Listing-only is not the name change.

Dark mode this ship: Simulator **light and dark** this turn.

Welcome this ship: first-open after uninstall is the product event, not home. Do not launch with a debug flag that skips first-run.

## Ship Mac (cheap)

- One Grok Bot desktop when shipping: the Xcode Mac only. Two machines flap local-exec.
- That Mac does archive, export, upload, sim shot. Not the coding loop.
- One script: `~/bin/testflight-deploy.sh <ios-dir>`. `PATH` starts `/usr/bin`.
- Archive first. The `.xcarchive` is the checkpoint. If the Mac drops, resume **that** archive/IPA. Do not re-archive.
- Drop mid-upload: read the deploy log for `UPLOAD SUCCEEDED` / `delivery-uuid` **before** retrying. The first `altool` may already have landed. Retrying the same IPA while that delivery is processing or VALID returns `ENTITY_ERROR.RELATIONSHIP.INVALID.INVALID_STATE` on `buildUpload`. That is not a failed ship. Poll `altool --build-status --delivery-id`.
- Export hung >2 min: kill it. Unsearch extra keychains. Manual Dist from **login** + the existing App Store profile.
- If ListMachines shows the ship Mac connected but Shell rejects its UUID: stop. One line to the user. Do not retry five times.
- `simctl`: `SIMCTL_CHILD_FOO=1 xcrun simctl launch`. Never `launch --setenv`.
- Do not hang on `simctl help`, `simctl ui send-text`, `simctl ui appearance`, `simctl terminate`, `simctl spawn`, `find`, or `spawn launchctl`. `io screenshot`, `launch`, and `ui appearance` often need **~20s**, not 6s. Timeout ~20s then killpg. A 6s kill is a false hang. Host `kill -9` the app.
- Shots go under a product shots folder on that Mac then CopyToBox. `/tmp` is not CopyToBox-readable.
- Native worktree path is in memory. Do not checkout the feature branch in an old clone (worktree conflict). Build the native iOS project from the worktree.
- Share extension / App Groups: if the Dist profile cannot bind the group, cut the extension from Dist. Do not stall the ship on portal login. File Import stays.

## What actually worked

1. CloudAgent PR. Native iOS project on the branch.
2. The user creates the ASC **app record** in the GUI if missing.
3. **Sim confirm on the ship Mac.** Then archive once.
4. Manual export of that archive with login Dist if automatic export hangs.
5. Unlock login via `~/bin/testflight-deploy.sh`. Do not copy that password into new files.
6. Upload with `xcrun altool --upload-app` and the ASC API key already on that Mac.
7. Set `usesNonExemptEncryption` false, add to the Internal group, add the user. No external group.
8. Tell the user: version, build, TestFlight state. Update Notion.

## After upload

`delivery-uuid` + altool `VALID` is **not** a TestFlight ship. The user cannot install until the build is on the Internal group.

Do this **this turn**, before saying it is on TestFlight:

1. Read the ASC build. If `usesNonExemptEncryption` is null, the beta state is `MISSING_EXPORT_COMPLIANCE`. PATCH the build to `false`. Do not trust altool’s encryption line alone.
2. POST the build onto the Internal beta group relationship. 422 “Build is not assignable” means compliance is still missing.
3. Prove membership this turn: the Internal group’s builds list includes this build id, and `buildBetaDetail.internalBuildState` is **IN_BETA_TESTING**.
4. Then tell the user to pull-to-refresh TestFlight.

Do not claim “it’s on TestFlight” from VALID alone. That is why a VALID build can sit in ASC while TestFlight still shows the old one.

Misses go into **this** skill the same turn (then [Skill sync](sand-workflow:skill-sync)). Do not invent a new self-learn skill. Keep this skill product-agnostic: worktree, bundle ID, and display name live on the product page.

## Do not

- Ship from linux-hammer or “the PR looks right”.
- Drive Organizer / mcpbridge from this Linux desk.
- Start Xcode Cloud unless the user asks.
- Fight a macOS first-launch (status 69) if login+API export works.
- Re-archive after a good `.xcarchive` already exists.
- Re-upload a build that already has a delivery-uuid.
- Tell the user a build is on TestFlight from VALID / a delivery-uuid alone.

## After it ships

Update the product Notion page (status, bundle ID, SKU, build, internal group, display name). Commit the build number to the PR.
