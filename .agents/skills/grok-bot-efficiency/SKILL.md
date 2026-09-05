---
name: Grok Bot efficiency
description: >-
  Use this on every Grok Bot turn. New bots get the same full Just works desk,
  not a one-line job.
---
Standing law for **all work**. This desk keeps long one-agent chats. Do not start a new chat to “compact”.

## Every turn

- Short replies. No filler status. No tool-call play-by-play.
- Ack once if the work is real, then the result.
- User-memory stays a few pointer lines.
- Changing facts and the live spine live on the desk map. Read via [Recall desk map](sand-workflow:recall-desk-map) only when needed.
- **As we go:** when a Goal, Lock, or Next changes, update that desk-map node (short). Do not inject the node every turn.
- Durable prefs: [Record durable preference](sand-workflow:record-durable-preference). One sentence.
- Repo implement/fix/refactor: [Offset repo to Cursor](sand-workflow:offset-repo-to-cursor). Same cloud agent for follow-ups. Launch with `model: composer-2.5` (Composer 2.5). Do not leave Auto until the user says otherwise.
- On real work, load [Just works](sand-workflow:just-works) first (read the file). Small talk skips. Do not dump iOS extras on a skill-sync turn.
- iOS ship: [Sim confirm](sand-workflow:sim-confirm) on the ship Mac this turn, then [Prototype to TestFlight](sand-workflow:prototype-to-testflight). `linux-hammer` is not a launch pass. One desktop (the Xcode Mac). Archive is the checkpoint. Do not live-`xcodebuild` from chat. Drop mid-upload: read `delivery-uuid` before retrying. Do not re-upload a landed build. VALID is not TestFlight; `IN_BETA_TESTING` on the Internal group is.
- Skill write or rewrite: [Skill sync](sand-workflow:skill-sync) the same turn (local + Notion + GitHub `glowly112/works`). Do not call it updated until all three exist. Put misses in the skill that already owns them. Do not invent a new self-learn skill. Skills stay **product-agnostic**: names, typefaces, bundle IDs, and worktree paths live on the product page and in memory, not in the recipe.
- **New Grok Bots:** same desk as this one. The description is the full short Just works path (restate and wait, 3–5 shipped refs before pixels, UI thrift then One UI factory, iOS 26 when iOS, offset repo to a Cursor cloud agent on Composer 2.5, skill-sync, done bar, talk like a person) plus one role line. A one-line job is a miss. Do not install `just-works-kernel` as Just works. Kernel does not win on conflict. Fresh PC: `glowly112/works` `.grok/skills` + `scripts/install-just-works.sh`.
- How-tos: open the wiki or desk-map node on demand. Never dump a wiki, CORE, DRIVER, AGENTS.md, hook pack, or style pack.
- Product hooks stay in that product.

## Don’t

- Don’t grow user-memory into essays.
- Don’t FORCE_NEW / “start a new chat” as the default.
- Don’t clone repos onto this computer or the Mac.
- Don’t fan the same fact to every agent.
- Don’t put tokens, health metrics, or money amounts in memory.
- Don’t retry a ship-Mac UUID five times when Shell only accepts another machine.
- Don’t ship TestFlight from a CloudAgent worker or a unit pass alone.
- Don’t hang on `simctl help`, `simctl ui send-text`, `simctl ui appearance`, `simctl terminate`, or `simctl spawn`. `io screenshot`, `launch`, and `ui appearance` often need ~20s. Timeout ~20s then killpg. Host `kill -9` the app.
- Don’t create a thinner teammate. Same level as this bot.
