---
name: Offset repo to Cursor
description: >-
  Use this when the task is to implement, fix, or refactor code in a
  GitHub/Origin repo from Grok Bot — launch a Cursor cloud agent instead of
  doing the coding loop in chat.
---
Hand the work to a Cursor cloud agent. Do not clone the repo onto the Grok Bot computer or the user's Mac. Do not implement the feature yourself in chat.

## When

- Implement / fix / refactor / investigate how repo code behaves
- A GitHub or Origin repo is named or already connected
- Greenfield "build an app" with no repo: `new_repo: true`

## When not

- A one-file lookup (`gh`, GitHub API, web) is enough
- The user explicitly asked for a local checkout
- The work is not code (email, calendar, Notion row, browser login)

## How

1. Scope the outcome, constraints, and how to tell it is done. Do not prescribe line-by-line edits.
2. Launch `CloudAgent` on that repo (or `new_repo`). Pass `model: composer-2.5` (Composer 2.5). Do not leave the model on Auto. Do not pick another model from the catalog unless the user names one. Mention any hunch as a labeled hypothesis only.
3. One short chat bubble: kicked off, then the cloud-agent card. No play-by-play.
4. Follow-ups go to that same agent, still on Composer 2.5. Do not launch a second one for the same job.
5. When it finishes, send the PR link (or the result). That is the update.

## Don't

- Don't paste style packs, wiki pages, or Multivibe hook text into the cloud-agent prompt.
- Don't narrate every tool beat in Grok Bot chat while it runs.
- Don't leave the cloud-agent model on Auto until the user says otherwise.
