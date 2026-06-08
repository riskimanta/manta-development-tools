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
- Pass
- Verified through ManDev UI
- Started ManDev with `pnpm dev`
- Opened session detail page:
  `/projects/cmpuxei2q0000ul28ztek2rot/work-progress/sessions/session-cmq4u77810001ullrd1l0pqh8-cmq4u99qx0003ullrdt3e1lks`
- Confirmed **Copy AI summary prompt** button appears near the session summary card
- Confirmed helper text states ManDev does not call an AI API
- Clicked **Copy AI summary prompt**
- Pasted clipboard content into a text editor
- Confirmed copied prompt includes:
  - project name
  - project local path when available
  - branch
  - session started/ended time
  - duration
  - snapshot count
  - first/latest commit
  - latest commit message
  - clean/dirty status
  - changed files list
  - snapshot timeline
  - requested AI output sections
- Invalid session URL check: Pass — `/projects/cmpuxei2q0000ul28ztek2rot/work-progress/sessions/invalid-session-id` keeps safe not-found behavior

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
