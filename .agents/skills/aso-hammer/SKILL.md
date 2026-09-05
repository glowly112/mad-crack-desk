---
name: ASO hammer
description: >-
  Use before calling an App Store listing done. 8 glare cases. Live iTunes check
  this turn. Home-screen name must match the locked listing name. Fail code
  ASO_FAIL. No rank trackers.
---
Use after [Store list](sand-workflow:store-list), before anyone says the listing is done. Cap 8. Pair with [Verify done](sand-workflow:verify-done): live iTunes GB + US and a character count this turn.

Load Apple listing limits and Review 2.3 from [developer.apple.com](https://developer.apple.com/app-store/product-page/) this turn.

Fail code: `ASO_FAIL`. Any miss is a fail. Do not invent ranks or download volumes.

## Glare list (all)

1. **Job.** One line: it is X. It is not Y. From the product, not a cool name.
2. **Name says the job.** One word if that word is search-clear and still X. Brand-only one word is allowed only if the subtitle states X on its own.
3. **Live collision.** Exact title clear on iTunes GB + US this turn. First token is not owned by a big unrelated app. Title-clear is not search-clear.
4. **Limits.** Name ≤30, subtitle ≤30, keywords ≤100. Commas, no spaces after them.
5. **Hygiene.** No word from the name or subtitle in keywords. No competitor names, category names, “app”, or extra plurals.
6. **First sentence.** Description opens with the job line. Humans, not a keyword dump.
7. **Screenshot story.** Open → type → result. First shot is the search card of X. Shots are the app in use, not title art.
8. **URLs + home name.** Privacy URL and support URL exist. Home-screen display name matches the locked listing name.

## Don’t

- Don’t pass on a plan. The iTunes pull and the counts ran this turn.
- Don’t install aso-skill, ASOManiac, Appeeky, or Search Ads rank trackers.
- Don’t submit App Review from this skill.
