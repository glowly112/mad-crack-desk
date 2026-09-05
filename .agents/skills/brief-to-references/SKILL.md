---
name: Brief to references
description: >-
  Use this when Jamie gives only a UI/app/website brief, or when porting an
  existing product to iOS. Lock 3–5 real shipped references before any pixels.
  Product screens own charm; Mobbin/Notes own chrome only. They do not pick
  sites unless they veto.
---
Jamie gives a brief only. Do not ask them to find sites, moodboards, or Dribbble links. You find the references. They may veto.

Run this **before** [One UI factory](sand-workflow:one-ui-factory). No tokens, Figma generation, or code until `REFS.md` exists.

## 1. Read the brief

Need: who it is for, the job, platforms (web / phone / desktop / iOS), and what “done” means. If those are missing, ask one question. Then stop asking.

## 2. Find real shipped work

Search for 8–12 live sites or app screens that already do this job well. Prefer:

- The product’s own shipped screens, if it already exists (web, TestFlight, prior iOS). These are the charm keepers.
- Live production URLs (you opened them)
- Mobbin screens of shipped apps, if that connector is on — chrome only when the product already exists
- Figma only if a file was already given

Reject: Dribbble/Behance concepts, AI galleries, “best website 2026” listicles, Material/SaaS purple templates, the model’s default look.

Pick **3–5** that share a direction (not five random aesthetics). Write why each earned a slot in one line (type, layout, color, voice).

### Existing product (charm first)

If the product already ships, lock its own library / editor / style (or equivalent) shots as charm **before** any Mobbin or system-app pick. Mobbin, Notes, and Journal may only lock chrome: search placement, compose, sheets, share, back.

A port that maps “library → Apple Notes” as the look has failed this skill.

### Mobbin MCP

If Mobbin is connected, search it here (Jamie’s account). One specific screen or flow per query. Look at the returned images. Cite each pick as a markdown link to its `mobbin_url`.

Use Mobbin for chrome language (how an iOS 26 app places search / compose / a sheet), not to replace the product face.

The connector returns pictures plus a link. That is the research. Do not replace the pictures with a prose recap (“modern, clean, black/white”). Do not send only URLs to a builder that cannot open Mobbin.

A named app on Mobbin is not a lock. One stoic. search returns Today, evening log, morning 18-step, Journey, Inspirations, onboarding, paywall, settings, lessons. Those do not share a layout. Do not hand the builder “copy stoic.”

**Map, do not moodboard.** For each screen the product will ship, lock:

- Charm: one product shot (own screen if it exists) → `refs/app/library-charm.png`
- Chrome (iOS): one Mobbin or system-app shot of the same *job* → `refs/app/library-chrome.jpg`

A flow is allowed only if every step is a shipped screen and you map each step. Do not attach a 12-screen flow for a 5-screen app.

The builder never searches Mobbin. It only copies the mapped files. Critique fails a screen that does not match its mapped charm shot, or that copies chrome from the charm shot (web pills, custom `+ New page`).

Best handoff:

1. You search and look at the shots
2. Lock the per-screen map plus steal/forbid in `REFS.md`
3. Save only the mapped images
4. The factory / cloud agent gets those files and the map

A Cursor cloud agent does not have this desk’s Mobbin session. Attach the mapped image files. Do not ask it to open Mobbin.com.

## 3. Lock

Write `REFS.md` in the repo or workspace:

- Brief restated
- Per-screen map: product route → charm file → chrome file (iOS) → URLs
- What to steal on each mapped screen (one line: charm vs chrome)
- What is forbidden: Notes-as-look, other screens from the same Mobbin app, plus the rejected set

Send Jamie one short message: the mapped URLs and the one-line direction. If they veto, replace only the vetoed refs. If they say nothing, proceed.

## 4. Hand off

Art direction is done. [One UI factory](sand-workflow:one-ui-factory) implements from `REFS.md` and the mapped shots. Critique fails any screen that does not match its mapped charm ref, or that HTML-ifies chrome. Do not invent a second look.
