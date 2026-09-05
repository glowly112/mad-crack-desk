---
name: Skill sync
description: >-
  Use this whenever a skill is written or rewritten, and on every Grok Bot turn
  that touches skills. Same turn: local SKILL.md, matching Notion wiki page,
  GitHub glowly112/works, and just-works-kernel. The short Just works path is
  SOT. Kernel does not win on conflict.
---
Three copies plus the kernel that Cloud Agents curl. Same turn. Fail if any is missing.

The **short Just works path** (done bar, next gate only, thrift / iOS 26 / mapped refs, look this turn) is SOT. Kernel does **not** win on conflict. A 12-stage FEATURE packet is not this path.

## When

A skill is created or rewritten. The user says update skills / Notion / GitHub. Also loaded from [Grok Bot efficiency](sand-workflow:grok-bot-efficiency) on every skill write.

## Where

| Copy | Where |
| --- | --- |
| Local | `update_state` skill write → `/home/box/agent-data/workflows/<slug>/SKILL.md` |
| Notion | Multivibe Wiki page titled `Skill — <slug>`. Parent: [Multivibe Wiki](https://app.notion.com/p/3c426612643381b1b1cae2e2b9a93f90). Create it if missing. Parenthetical titles count. |
| GitHub works | `glowly112/works` at `.grok/skills/<slug>/SKILL.md`. CloudAgent. Do not clone. New skills also get a line in `SKILLS.md`. |
| Kernel | `glowly112/just-works-kernel` at `skills/<slug>/SKILL.md` when that slug exists there. CloudAgent. Do not clone. Kernel follows this recipe. |

Do not put Grok Bot skills in a product repo.

Skills stay **product-agnostic**. Product names, typefaces, bundle IDs, and worktree paths live on that product’s Notion page and in memory, not in the recipe.

## Loop

1. Write or rewrite the local skill.
2. Fetch the Notion page by title `Skill — <slug>`. `update_content` or create under the wiki. Same body, no secrets.
3. CloudAgent on `https://github.com/glowly112/works`: write `.grok/skills/<slug>/SKILL.md` to match local. If it is new, add it to `SKILLS.md`.
4. If the slug exists on `glowly112/just-works-kernel`, CloudAgent that file to match local too.
5. Do not say the skill is updated until local + Notion + works happened **this turn**. Kernel match the same turn when the slug lives there.

This skill follows the same loop.

## Don't

- Notion-only or local-only
- “Kernel wins on conflict”
- A 12-gate FEATURE pipeline as a substitute for [Just works](sand-workflow:just-works)
- A third log
- Dump a wiki into the skill
- Product names, typefaces, bundle IDs, worktree paths
- Keychain passwords, `.p8` contents, tokens
- Clone the repo onto this computer
