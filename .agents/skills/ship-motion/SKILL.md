---
name: Ship motion
description: >-
  Use this after verify-done on a ship. Keep git, deploy, and the product page
  moving. Do not claim done from a plan.
---
# Ship motion

After [Verify done](sand-workflow:verify-done), keep the ship moving.

1. Commit changed files, push if there is a remote (no force-push of main)
2. Latest deploy if this is a Vercel app or they asked live
3. Update the repo status file if the project has one
4. Update the product Notion page only when that page is already the source of truth for the ship
