# SPEC-124: Fix Race Condition in AI Server WebSocket Tests

**Priority**: Medium
**Estimated effort**: 2h
**Files affected**: `tests/ai-server.test.js` (test-only, no production code changes)
**Depends on**: none
**PRD**: `docs/prd/PRD-AI-SERVER-TEST-RACE-CONDITION.md`

## Problem

6 tests in `describe('AIServer — SPEC-085')` within `tests/ai-server.test.js` fail consistently, all with the same shape: expecting a real response type (`pong`, `error`, `state_synced`, `npc_fallback`, `test_broadcast`) but receiving `'ready'` (the connection handshake message) instead.

**Confirmed root cause (not speculative — verified by direct experiment):** this is a test-file race condition, not a server bug. The failing tests wait for the next WebSocket message using:

```js
ws.prependOnceListener('message', () => r(messages[messages.length - 1]));
```

`prependOnceListener` puts this listener at the *front* of the event's listener list, so it runs *before* `connectAndCollect()`'s own `.on('message', ...)` handler (registered earlier, at connection time) has pushed the new message into `messages`. The callback reads `messages[messages.length - 1]` while the array still only contains the previous message (`'ready'`), so every one of these waits resolves with stale data regardless of which real response actually arrived.

The file already has the correct helper for this, `waitForNth()` (`tests/ai-server.test.js:521-531`), which uses plain `.on()` (preserving registration order — runs *after* the push-handler) and re-checks array length inside the handler. It's used once in the file; the 6 failing tests use the buggy inline pattern instead. Verified fix: rewriting the `'should respond to ping with pong'` test to use `collector.ready` + `waitForNth(collector, 1)` makes it pass immediately with zero server-side changes.

Full diagnosis, code-level detail, and the exact before/after diff pattern: see `docs/prd/PRD-AI-SERVER-TEST-RACE-CONDITION.md`.

## Solution

Replace all 12 occurrences of the `prependOnceListener`-based wait pattern within the `AIServer — SPEC-085` describe block with the existing `collector.ready` (for the initial handshake wait) / `waitForNth(collector, n)` (for the Nth subsequent message) helpers — see the PRD's section 3.1 for the exact before/after code for both the single-client and dual-client (broadcast) cases.

Apply this to all 8 tests in the block that currently use the fragile pattern (the 6 failing ones, plus the 2 that happen to pass today only because they don't race on a second message — fix those too so the footgun doesn't resurface).

## Acceptance Criteria

- [ ] All 6 currently-failing tests pass
- [ ] No previously-passing test in `tests/ai-server.test.js` regresses
- [ ] Zero remaining `prependOnceListener` usages in the `AIServer — SPEC-085` describe block
- [ ] `npx vitest run tests/ai-server.test.js` — 0 failures
- [ ] `npx vitest run` (full suite) — no new failures introduced elsewhere
- [ ] No changes to any file outside `tests/ai-server.test.js`

## Testing

- `npx vitest run tests/ai-server.test.js` before/after — 6 failures → 0.
- Run the file 3-5 times back to back (or `--repeat` if supported) to rule out port-reuse flakiness from the real `AIServer` instances spun up on `TEST_PORT = 3098` per test.
- Full `npx vitest run` to confirm no regressions in the other ~940 passing tests.
