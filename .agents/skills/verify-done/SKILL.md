---
name: Verify done
description: >-
  Use this before saying it works, tests pass, bug fixed, ready, LGTM, or before
  a PR or TestFlight. No done claim without a command run this turn.
  linux-hammer is not a launch pass.
---
No completion claims without a command run this turn.

## When

About to say it works / tests pass / bug fixed / ready / LGTM / before a PR / before TestFlight.

## Gate

1. Name the proving command
2. Run it now (not an old log)
3. Quote exit code or fail count
4. If you cannot run it, say what the user must click — do not invent the result

A bug fix re-checks the original symptom. A new regression test should have failed without the fix when you can prove that.

`linux-hammer` is a unit pass only. It is not a launch pass and not a TestFlight pass.

A still of sample text is not wrap-while-typing proof. Overlapping glyphs while typing is a fail even if dismiss-keyboard looks clean (`TEXT_OVERLAP`).

A TestFlight `delivery-uuid` or altool `VALID` is not a TestFlight pass. Prove the build id is on the Internal group this turn, `internalBuildState` is **IN_BETA_TESTING**, and encryption is not `MISSING_EXPORT_COMPLIANCE`. Otherwise the user still sees the old build.

## Refuse

Should pass now. Looks correct. Last session's output.

## Mobile extra

If the surface has a text field or sheet, done means a phone-width check with the keyboard open. Desktop DevTools alone does not count. A green `xcodebuild` is not a visual pass — pair with [Sim confirm](sand-workflow:sim-confirm) when a simulator exists. Do not ship Internal TestFlight without that Simulator loop this turn.
