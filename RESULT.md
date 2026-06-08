# Phase 5F — Work Progress AI Summary Prompt

## Summary
Added a copyable AI summary prompt on the Work Progress Session Detail page. ManDev builds a structured prompt from session data for manual use in Cursor, Claude, or ChatGPT without calling an AI API.

## Branch
`feat/work-progress-ai-summary-prompt`

## Commit
`e5a6783` — `feat: add work progress ai summary prompt`

## Delivered
- Added Work Progress AI summary prompt builder
- Added Copy AI summary prompt button on session detail page
- Included project/session metadata, changed files, and snapshot timeline in copied prompt
- Added UI copy explaining no AI API is called
- Added tests
- Updated docs

## Validation
| Check | Result |
|-------|--------|
| `pnpm test` | Pass — 497 tests |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

## Manual verification
- Not performed yet
- Recommended steps:
  1. `git checkout feat/work-progress-ai-summary-prompt && pnpm dev`
  2. Open `/projects/cmpuxei2q0000ul28ztek2rot/work-progress/sessions/session-cmq4u77810001ullrd1l0pqh8-cmq4u99qx0003ullrdt3e1lks`
  3. Confirm **Copy AI summary prompt** appears near the session summary card
  4. Click the button and paste into a text editor
  5. Confirm prompt includes project name, branch, session time/duration, snapshot count, commit metadata, changed files, snapshot timeline, and requested AI output sections
  6. Confirm helper text states ManDev does not call an AI API
  7. Open an invalid session URL and confirm `notFound()` behavior is unchanged

## PR
- URL: https://github.com/riskimanta/manta-development-tools/pull/18
- Status: OPEN

## Git status
On branch `feat/work-progress-ai-summary-prompt`, up to date with `origin/feat/work-progress-ai-summary-prompt`, working tree clean.

## Known limitations
- No AI API integration
- No automatic AI-generated summary
- No persisted summary field
- User must paste the prompt manually into Cursor, Claude, ChatGPT, or another AI tool
- Sessions are still derived from snapshots
