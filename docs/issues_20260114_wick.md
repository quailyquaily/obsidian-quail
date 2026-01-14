# Project Review Issues (2026-01-14)

This document captures issues found during a static review of the repository.

Merged sources:

- `docs/issues_20260114_wick.reviewed.md` (review of this list)
- `docs/issues_20260114_john.md` + `docs/issues_20260114_john.reviewed.md`

Priority mapping used for John’s list: **Critical → P0**, **High → P1**, **Medium → P2**, **Low → P3**.

## Priority Scale

- **P0**: likely crash/security issue/data loss, or blocks core flows
- **P1**: major correctness/UX issue with common workflows
- **P2**: moderate bug or maintainability problem
- **P3**: polish, tech debt, or best-practice improvements

## Issues

To keep tables readable, issues are grouped by priority.  
Columns:

- **Verification**: whether the issue was confirmed during review
- **State**: whether the issue is still open or has been fixed

### P0

| ID | Type | Summary | Evidence | Source | Verification | State |
|---:|:--|:--|:--|:--|:--|:--|
| 1 | Logic/Async Bug | Token refresh logic is inverted and async flows weren’t awaited (stale tokens, unpredictable startup). | `main.ts` | Wick + John | Verified | Fixed |
| 2 | Auth Bug/Security | OAuth flow: PKCE `plain`, callback parsing called with wrong args, async callback not awaited, multiple listeners can race/resolve multiple times. | `src/oauth/oauth.js` | Wick + John | Verified | Fixed |
| 3 | Bug | `replaceImageUrls()` had inconsistent return type; now throws on mismatch and callers surface the error instead of continuing. | `src/util.ts`, `src/actions/index.ts:91` | Wick | Verified | Fixed |

### P1

| ID | Type | Summary | Evidence | Source | Verification | State |
|---:|:--|:--|:--|:--|:--|:--|
| 4 | Bug | Cover image can be uploaded twice (included in images list + uploaded again as cover). | `src/util.ts:137`, `src/actions/index.ts:77` | Wick + John | Verified | Open |
| 5 | Bug | `verifyFrontmatter()` returns inconsistent shape (`validated` vs `verified`) on failure. | `src/frontmatter.ts:53`, `src/frontmatter.ts:144` | Wick | Verified | Open |
| 6 | Bug | Auto-generated metadata doesn’t reliably affect outgoing payload (frontmatter update not awaited; payload built from earlier values). | `src/actions/index.ts:130`, `src/actions/index.ts:168` | Wick | Verified | Open |
| 7 | Security | `MessageModal` uses `innerHTML` for message rendering (XSS risk if message is untrusted). | `src/modals/MessageModal.ts:119` | Wick | Verified | Open |
| 8 | Bug | MIME type guard mismatch (`null` vs `""`) allows unknown types to pass and be processed. | `src/util.ts:19`, `src/util.ts:144` | Wick | Verified | Open |
| 9 | Logic Bug | Startup hydration chicken-and-egg: `isLogged()` requires `me/lists`, but `updateMe/updateChannels` only run when already logged. | `main.ts` | Wick | Verified | Open |
| 10 | Null Safety | Publish action can crash: `savePost()` may return `undefined`, but `pt.slug` is accessed unguarded. | `src/actions/publish.ts:31` | John | Verified | Open |
| 11 | Input Validation | Deliver/send calls API with possibly empty `slug` (no validation). | `src/actions/send.ts:26` | John | Verified | Open |
| 12 | Error Handling | Clipboard writes are unguarded; failures can surface as unhandled promise rejections. | `src/modals/ErrorModal.ts:63`, `src/modals/PublishResultModal.ts:142` | John | Verified | Open |

### P2

| ID | Type | Summary | Evidence | Source | Verification | State |
|---:|:--|:--|:--|:--|:--|:--|
| 13 | Null Safety | `formalizeFrontmatter()` uses `frontmatter?.tags.constructor.name` and can throw when `tags` is null/undefined. | `src/frontmatter.ts:178` | John | Verified | Open |
| 14 | Error Handling | `decodeURIComponent()` used without try/catch; malformed percent-encoding can throw and abort flows. | `src/util.ts:220`, `src/util.ts:233`, `src/util.ts:255` | Wick + John | Verified | Open |
| 15 | Bug | Image URL replacement only matches full-line images (`startsWith/endsWith`), missing inline/indented cases. | `src/util.ts:217` | Wick | Verified | Open |
| 16 | Bug | Second-pass wiki-link replacement doesn’t mark `used=true` and doesn’t `break`, so URLs can be reused/misassigned. | `src/util.ts:257` | Wick | Verified | Open |
| 17 | Bug/UX | `ErrorModal` assumes an `Error`; many callers pass unknown caught values, leading to empty/odd messages. | `src/modals/ErrorModal.ts:7`, `src/actions/unpublish.ts:32` | Wick | Verified | Open |
| 18 | Performance | `getImageFiles()` loops over all `resolvedLinks`; can directly access `resolvedLinks[currentMd.path]`. | `src/util.ts:101` | John | Verified | Open |

### P3

| ID | Type | Summary | Evidence | Source | Verification | State |
|---:|:--|:--|:--|:--|:--|:--|
| 19 | Logic Bug | Tags validation regex uses `/g` with `test()`; currently low-risk, but better to remove `/g` to avoid statefulness pitfalls. | `src/frontmatter.ts` | John | Partially Verified | Fixed |
| 20 | I18n | Template replacement is naive (replaces first occurrence per key; no escaping). | `src/i18n/index.ts` | John | Partially Verified | Fixed |
| 21 | Type Safety | Excessive `any` use (clients, settings, frontmatter) reduces compile-time guarantees. | `src/interface/index.ts`, `src/actions/*.ts`, `global.d.ts` | John | Verified | Fixed |
| 22 | Code Quality | Dead commented code remains in `main.ts`. | `main.ts` | John | Verified | Fixed |
| 25 | Documentation | Typo in comment (“accont”). | `src/util.ts` | John | Verified | Fixed |
| 26 | Error Handling | No explicit request timeouts (OAuth `fetch`; `quail-js` calls not verified here). | `src/oauth/oauth.js` | John | Partially Verified | Fixed |
| 27 | Build/CI | Release workflow uses deprecated patterns and broad permissions. | `.github/workflows/release.yaml:13`, `.github/workflows/release.yaml:18` | Wick | Verified | Open |

### Not Verified (Claims)

| ID | Type | Summary | Evidence | Source | Verification |
|---:|:--|:--|:--|:--|:--|
| 23 | Code Quality | Debug UI (dialog test buttons, token expiry button) exists but is hidden behind a multi-click toggle. It's a correct behavior. | `src/setting/index.ts:127` | John | Not Verified |
| 24 | Configuration | OAuth client id/redirect URI/base URLs are hardcoded. But it's fine, because the OAuth client is only used by this plugin. | `src/oauth/oauth.js:4` | John | Not Verified |
| 28 | UX Bug | Loading modal not closed on image upload error (claimed); not reproduced—publish closes in catch/finally, main crash is missing `pt` guard. | `src/actions/publish.ts:30` | John | Not Verified |
| 29 | UX Bug | Preview early-return leaves loading modal open (claimed); not reproduced—modal closes via `finally`. | `src/actions/preview.ts:19` | John | Not Verified |

## Notes / Suggested Fix Directions (High Level)

- **Token logic (1):** fixed in `main.ts` (await refresh/clear flows; compare expiry against `now + threshold`).
- **Startup hydration (9):** decouple “has tokens” from “has cached me/lists” so `updateMe()/updateChannels()` can repopulate state on load.
- **OAuth (2):** fix callback argument usage and navigation handling; use PKCE `S256`; ensure webRequest listener resolves once and cleans up.
- **Images (3, 4, 10–12):** make `replaceImageUrls()` return a consistent object type; replace URLs using a regex over the full content; ensure cover image isn’t double-uploaded; harden decoding.
- **Frontmatter (5, 6, 8):** return a consistent `{verified, reason}` shape; ensure metadata generation is awaited and payload uses updated values; fix MIME type guard.
- **Security/Privacy (7, 14):** avoid `innerHTML` for messages (use `setText` + `<br>` nodes); redact tokens in debug UI by default.
