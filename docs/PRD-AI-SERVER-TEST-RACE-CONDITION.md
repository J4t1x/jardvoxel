# PRD: Fix Race Condition in AI Server WebSocket Tests

**Version:** 1.0.0
**Date:** 2026-07-10
**Status:** Diagnosed — ready for implementation
**Related:** `ai-server/` (AI Server Architecture, SPEC-085)

---

## 1. Overview

`tests/ai-server.test.js` has 6 consistently failing tests, all in the `describe('AIServer — SPEC-085')` block. All 6 fail with the same shape of error: the test expects a specific response type (`pong`, `error`, `state_synced`, `npc_fallback`, `test_broadcast`) but receives `'ready'` instead — the connection handshake message, not the actual response to the message the test just sent.

### 1.1 Diagnosis (confirmed, not speculative)

This is **not a server bug**. `ai-server/server.js` responds correctly. The failure is a race condition in the test file's own wait-for-message helper pattern, confirmed by direct experiment: rewriting the `'should respond to ping with pong'` test to use the file's own (already-correct, but underused) `waitForNth()` helper instead of the ad-hoc pattern makes it pass immediately, with no server-side changes.

**Root cause:** each of the 6 failing tests waits for the *next* WebSocket message like this:

```js
const pong = await new Promise(r => {
  if (messages.length > 1) r(messages[1]);
  else ws.prependOnceListener('message', () => r(messages[messages.length - 1]));
});
```

`connectAndCollect()` (`tests/ai-server.test.js:500-519`) already registers its own `ws.on('message', ...)` handler that pushes every incoming message into the `messages` array — registered once, at connection time. The pattern above additionally registers a **second**, separate listener via `ws.prependOnceListener(...)`.

`prependOnceListener` inserts the new listener at the **front** of the listener list for that event. Node's `EventEmitter` invokes all listeners for an event synchronously, in registration order, within the same `emit()` call. Because the prepended listener runs *before* `connectAndCollect`'s original push-handler, the callback `() => r(messages[messages.length - 1])` reads `messages` **before** the new message has been pushed to it — so it always resolves with the *previous* last element (`'ready'`, since these tests only wait for one prior message), not the message that just arrived.

The file already contains the correct pattern for this exact problem, `waitForNth()` (`tests/ai-server.test.js:521-531`), which registers its handler via plain `.on()` (preserving registration order, so it runs *after* the push-handler) and re-checks the array length *inside* the handler rather than assuming the last element is the new one. It's used exactly once in the file (`should broadcast messages to all clients` doesn't even use it — it uses the same buggy pattern). All 12 occurrences of the buggy `prependOnceListener` pattern are in tests written after `waitForNth` was introduced, suggesting it was either not known about or not used consistently when these tests were added.

### 1.2 Scope

Only `tests/ai-server.test.js` is affected. No production code (`ai-server/server.js`, `ai-server/state-manager.js`, `ai-server/llm-interface.js`, `core/jardvoxel-survival-ai-client.js`) needs to change — this PRD is test-only.

### 1.3 Non-Goals

- No changes to `AIServer`, `StateManager`, `LLMInterface`, or `AIClient` production behavior.
- No changes to the `AIClient Lifecycle` / `Auto-Reconnect` / `Message Handling` / `Request/Response` / `High-Level API` / `Graceful Degradation` describe blocks earlier in the same file — those use a fully mocked `WebSocket` (`MockWebSocket`) with synchronous `_receive()`, not the real `ws` client against a real server, and are not affected by this race condition. They already pass.

---

## 2. Affected Tests (all in `describe('AIServer — SPEC-085')`)

| Test | Line (approx.) | Expects | Actually gets |
|------|------|---------|----------------|
| should respond to ping with pong | 607 | `pong` | `ready` |
| should return error for unknown message type | 623 | `error` | `ready` |
| should handle sync_state and persist NPCs | 640 | `state_synced` | `ready` |
| should send npc_fallback when LLM unavailable | 664 | `npc_fallback` | `ready` |
| should handle invalid JSON gracefully | 691 | `error` | `ready` |
| should broadcast messages to all clients | 707 | `test_broadcast` (×2 clients) | `ready` |

Note: `should accept WebSocket client connections` and `should send ready confirmation on connect` (lines ~586, ~596) only wait for the *first* message and pass today — they're unaffected because there's no second message being raced.

---

## 3. Implementation Plan

### 3.1 Fix pattern

Replace each buggy inline wait with the existing `waitForNth()` helper (or `connector.ready` for the initial handshake wait, which is already race-free). Example, for the `ping`/`pong` test:

```js
// Before
const { ws, messages } = connectAndCollect(TEST_PORT);
await new Promise(r => {
  if (messages.length > 0) r();
  else ws.prependOnceListener('message', () => r());
});
ws.send(JSON.stringify({ type: 'ping' }));
const pong = await new Promise(r => {
  if (messages.length > 1) r(messages[1]);
  else ws.prependOnceListener('message', () => r(messages[messages.length - 1]));
});

// After
const collector = connectAndCollect(TEST_PORT);
const { ws } = collector;
await collector.ready;
ws.send(JSON.stringify({ type: 'ping' }));
const pong = await waitForNth(collector, 1);
```

For the broadcast test (2 clients, both need their 2nd message):

```js
const c1 = connectAndCollect(TEST_PORT);
const c2 = connectAndCollect(TEST_PORT);
await Promise.all([c1.ready, c2.ready]);
server.broadcast({ type: 'test_broadcast', payload: 42 });
const [m1, m2] = await Promise.all([waitForNth(c1, 1), waitForNth(c2, 1)]);
expect(m1.type).toBe('test_broadcast');
expect(m2.type).toBe('test_broadcast');
```

### 3.2 Steps

1. Apply the substitution above to all 6 failing tests (and the 2 passing-but-still-using-the-fragile-pattern tests, for consistency — `should accept WebSocket client connections` / `should send ready confirmation on connect` should use `collector.ready` instead of the inline `prependOnceListener` wait too, even though they don't currently fail, to remove the footgun entirely).
2. Delete the now-unused inline wait boilerplate; every wait in this describe block should go through `collector.ready` (first message) or `waitForNth(collector, n)` (Nth message).
3. Run the full file in isolation and in the full suite (order-dependence check — these tests spin up real servers on `TEST_PORT = 3098`, confirm no port-reuse flakiness across repeated runs).

### 3.3 Optional hardening (not required to fix the bug, but cheap given we're already in this file)

- Add a short comment above `waitForNth` noting it's the required pattern for this file, so future tests don't reintroduce the `prependOnceListener` footgun.
- Consider whether `connectAndCollect`'s `messages` + `waiters` queue design could be simplified into a single async iterator, but that's a larger refactor — out of scope here unless the user wants it.

---

## 4. Acceptance Criteria

- [ ] All 6 currently-failing tests pass
- [ ] No previously-passing test in `tests/ai-server.test.js` regresses
- [ ] Zero remaining `prependOnceListener` usages in the `AIServer — SPEC-085` describe block
- [ ] `npx vitest run tests/ai-server.test.js` — 0 failures
- [ ] `npx vitest run` (full suite) — no new failures introduced elsewhere
- [ ] No changes to any file outside `tests/ai-server.test.js`

---

## 5. Testing Plan

- `npx vitest run tests/ai-server.test.js` before and after — confirm 6 failures → 0 failures.
- `npx vitest run tests/ai-server.test.js --repeat=5` (or manually run 3-5 times back to back) to rule out residual flakiness from the real-server/real-port setup, since these tests (unlike the mocked-WebSocket ones earlier in the file) spin up an actual `AIServer` on a real TCP port per test.
- Full `npx vitest run` to confirm the fix doesn't disturb the other 900+ passing tests.

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Fix reveals a real, previously-masked server bug | Low | Medium | The manual experiment (rewriting one test) already confirmed the server responds correctly once the test waits properly — this is very unlikely to surface anything new |
| Port `3098` reuse flakiness across tests in the same file | Low | Low | Already a pre-existing risk independent of this fix; verify with repeated runs per Testing Plan |
| Missed a 7th occurrence of the same pattern elsewhere in the file | Low | Low | `grep -c prependOnceListener` before/after should go from 12 to 0 within the SPEC-085 block |

---

**End of PRD**
