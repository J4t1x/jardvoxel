import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { AIClient } from '../core/jardvoxel-survival-ai-client.js';
import { AIServer } from '../ai-server/server.js';
import { LLMInterface, DEFAULT_MODEL } from '../ai-server/llm-interface.js';
import { StateManager } from '../ai-server/state-manager.js';
import { WebSocket as WSClient } from 'ws';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this._sent = [];
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }
  send(data) { this._sent.push(data); }
  close() { this.readyState = MockWebSocket.CLOSED; if (this.onclose) this.onclose(); }
  _receive(data) { if (this.onmessage) this.onmessage({ data: JSON.stringify(data) }); }
}

describe('AI Server Architecture — SPEC-085', () => {
  let client;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    client = new AIClient({ url: 'ws://localhost:3001' });
  });

  describe('AIClient Lifecycle', () => {
    it('should create client with default URL', () => {
      const c = new AIClient();
      expect(c.url).toBe('ws://localhost:3001');
    });

    it('should create client with custom URL', () => {
      const c = new AIClient({ url: 'ws://custom:9999' });
      expect(c.url).toBe('ws://custom:9999');
    });

    it('should start disconnected', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('should connect without crash', () => {
      expect(() => client.connect()).not.toThrow();
    });

    it('should emit connected on open', async () => {
      let connected = false;
      client.on('connected', () => { connected = true; });
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      expect(connected).toBe(true);
      expect(client.isConnected()).toBe(true);
    });

    it('should disconnect cleanly', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('Auto-Reconnect', () => {
    it('should schedule reconnect on close', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      expect(client.isConnected()).toBe(true);
      // Simulate close
      client.ws.onclose();
      expect(client.isConnected()).toBe(false);
      // Reconnect should be scheduled
      expect(client._reconnectTimer).not.toBeNull();
    });

    it('should use exponential backoff', async () => {
      const initialBackoff = client._backoff;
      client._scheduleReconnect();
      const afterFirst = client._backoff;
      expect(afterFirst).toBeGreaterThan(initialBackoff);
      client._scheduleReconnect();
      const afterSecond = client._backoff;
      expect(afterSecond).toBeGreaterThan(afterFirst);
    });

    it('should not reconnect after explicit disconnect', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      client.disconnect();
      expect(client._shouldReconnect).toBe(false);
      expect(client._reconnectTimer).toBeNull();
    });

    it('should track reconnect attempts', () => {
      expect(client.getReconnectAttempts()).toBe(0);
      client._scheduleReconnect();
      expect(client.getReconnectAttempts()).toBe(1);
    });
  });

  describe('Message Handling', () => {
    it('should send messages when connected', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      const sent = client.send({ type: 'ping' });
      expect(sent).toBe(true);
    });

    it('should not send when disconnected', () => {
      const sent = client.send({ type: 'ping' });
      expect(sent).toBe(false);
    });

    it('should register and emit handlers', () => {
      let received = null;
      client.on('test_event', (data) => { received = data; });
      client._emit('test_event', { value: 42 });
      expect(received.value).toBe(42);
    });

    it('should unregister handlers with off', () => {
      const handler = vi.fn();
      client.on('test', handler);
      client.off('test', handler);
      client._emit('test', {});
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle incoming messages', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      let received = null;
      client.on('pong', (data) => { received = data; });
      client.ws._receive({ type: 'pong' });
      expect(received).not.toBeNull();
    });
  });

  describe('Request/Response', () => {
    it('should return fallback when not connected', async () => {
      const response = await client.request({ type: 'test' });
      expect(response.type).toBe('fallback');
      expect(response.reason).toBe('not_connected');
    });

    it('should handle request timeout', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      const response = await client.request({ type: 'test' }, 100);
      expect(response.type).toBe('fallback');
      expect(response.reason).toBe('timeout');
    });

    it('should resolve request on response', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));

      const promise = client.request({ type: 'npc_dialogue' }, 1000);
      // Simulate server response
      setTimeout(() => {
        const sent = JSON.parse(client.ws._sent[0]);
        client.ws._receive({ type: 'npc_response', _requestId: sent._requestId, text: 'Hello!' });
      }, 10);

      const response = await promise;
      expect(response.text).toBe('Hello!');
    });
  });

  describe('High-Level API', () => {
    it('should request NPC dialogue', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      const promise = client.requestNPCDialogue('npc_1', { name: 'Thor' }, {});
      setTimeout(() => {
        const sent = JSON.parse(client.ws._sent[0]);
        client.ws._receive({ type: 'npc_response', _requestId: sent._requestId, text: 'Hi!' });
      }, 10);
      const response = await promise;
      expect(response.text).toBe('Hi!');
    });

    it('should request quest generation', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      const promise = client.requestQuest({ biome: 'forest' });
      setTimeout(() => {
        const sent = JSON.parse(client.ws._sent[0]);
        client.ws._receive({ type: 'quest_generated', _requestId: sent._requestId, quest: { type: 'fetch' } });
      }, 10);
      const response = await promise;
      expect(response.quest.type).toBe('fetch');
    });

    it('should sync state', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      const sent = client.syncState({ worldSeed: 12345 });
      expect(sent).toBe(true);
    });
  });

  describe('Graceful Degradation', () => {
    it('should work fully without AI server', () => {
      // Client starts disconnected, game should still function
      expect(client.isConnected()).toBe(false);
      // All requests return fallback
      client.request({ type: 'test' }).then(response => {
        expect(response.type).toBe('fallback');
      });
    });

    it('should not crash on invalid JSON', async () => {
      client.connect();
      await new Promise(r => setTimeout(r, 10));
      expect(() => {
        if (client.ws.onmessage) client.ws.onmessage({ data: 'invalid json' });
      }).not.toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════
// Server-side tests — LLMInterface (SPEC-085)
// Covers: throttling, Ollama, Cloud fallback, checkOllama
// ═══════════════════════════════════════════════════════════

const _aiDir = dirname(fileURLToPath(import.meta.url));
const _stateFile = join(_aiDir, '..', 'ai-server', 'data', 'state.json');

describe('LLMInterface — SPEC-085', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should default to gemma3:1b model and 11434 Ollama URL', () => {
    const llm = new LLMInterface();
    expect(llm.model).toBe(DEFAULT_MODEL);
    expect(llm.ollamaUrl).toBe('http://localhost:11434');
    expect(llm.getThrottleMs()).toBe(2000);
  });

  it('should accept custom model and URLs', () => {
    const llm = new LLMInterface({
      model: 'llama3.2:3b',
      ollamaUrl: 'http://other:11434',
      cloudApiKey: 'sk-test',
      cloudApiUrl: 'https://api.test',
    });
    expect(llm.model).toBe('llama3.2:3b');
    expect(llm.cloudApiKey).toBe('sk-test');
  });

  it('should throttle to max 1 request / 2s', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'ok' }),
    });
    const llm = new LLMInterface();
    await llm.checkOllama();

    const start = Date.now();
    await llm.generate('prompt 1', {}, { taskType: 'npc_dialogue' });
    await llm.generate('prompt 2', {}, { taskType: 'npc_dialogue' });
    const elapsed = Date.now() - start;
    // Second call must wait ~2s due to throttle
    expect(elapsed).toBeGreaterThanOrEqual(1900);
  });

  it('should query Ollama and return response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Hello traveler!' }),
    });
    const llm = new LLMInterface();
    await llm.checkOllama();
    const result = await llm.generate('Say hi', {}, { taskType: 'npc_dialogue' });
    expect(result).toBe('Hello traveler!');
    // Verify fetch was called against Ollama /api/generate
    const callUrl = global.fetch.mock.calls[1][0];
    expect(callUrl).toContain('/api/generate');
  });

  it('should fall back to Cloud API when Ollama fails', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url) => {
      callCount++;
      if (url.includes('/api/generate') || url.includes('/api/tags')) {
        return Promise.reject(new Error('ECONNREFUSED'));
      }
      // Cloud API
      return Promise.resolve({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'cloud-response' } }] }),
      });
    });
    const llm = new LLMInterface({
      cloudApiKey: 'sk-test',
      cloudApiUrl: 'https://api.test',
    });
    await llm.checkOllama();
    const result = await llm.generate('prompt', {}, { taskType: 'npc_dialogue' });
    expect(result).toBe('cloud-response');
  });

  it('should return null (template fallback) when both Ollama and Cloud unavailable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('no service'));
    const llm = new LLMInterface();
    await llm.checkOllama();
    const result = await llm.generate('prompt', {}, { taskType: 'npc_dialogue' });
    expect(result).toBeNull();
  });

  it('should return null when no cloud configured and Ollama fails', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/tags')) return Promise.resolve({ ok: false });
      return Promise.reject(new Error('fail'));
    });
    const llm = new LLMInterface();
    const ok = await llm.checkOllama();
    expect(ok).toBe(false);
    expect(llm._ollamaAvailable).toBe(false);
    const result = await llm.generate('prompt', {}, { taskType: 'npc_dialogue' });
    expect(result).toBeNull();
  });

  it('checkOllama should set _ollamaAvailable true when reachable', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    const llm = new LLMInterface();
    const ok = await llm.checkOllama();
    expect(ok).toBe(true);
    expect(llm._ollamaAvailable).toBe(true);
    expect(llm.isAvailable()).toBe(true);
  });

  it('should build task-aware prompts', () => {
    const llm = new LLMInterface();
    const questPrompt = llm._buildPrompt('Generate quest', { biome: 'forest' }, 'generate_quest');
    expect(questPrompt).toContain('biome');
    expect(questPrompt).toContain('valid JSON');
    const lorePrompt = llm._buildPrompt('Generate lore', {}, 'generate_lore');
    expect(lorePrompt).toContain('narrative');
  });
});

// ═══════════════════════════════════════════════════════════
// Server-side tests — StateManager (SPEC-085)
// Covers: persistence (JSON), NPC/quest/event/lore CRUD
// ═══════════════════════════════════════════════════════════

describe('StateManager — SPEC-085', () => {
  let state;

  beforeEach(() => {
    // Clean any leftover state file
    if (existsSync(_stateFile)) unlinkSync(_stateFile);
    state = new StateManager();
    state.init();
  });

  afterEach(() => {
    state.flush();
    if (existsSync(_stateFile)) unlinkSync(_stateFile);
  });

  it('should initialize with empty state', () => {
    expect(state.getNPC('x')).toBeNull();
    expect(state.getQuest('x')).toBeNull();
    expect(state.getEvents()).toEqual([]);
    expect(state.getLore()).toEqual([]);
    expect(state.getCivilizations()).toEqual([]);
    expect(state.getWorldSeed()).toBeNull();
  });

  it('should persist and reload NPC memory (JSON persistence)', () => {
    state.setNPC('npc_1', { name: 'Tharmond', profession: 'merchant' });
    state.flush();

    const reloaded = new StateManager();
    reloaded.init();
    const npc = reloaded.getNPC('npc_1');
    expect(npc).not.toBeNull();
    expect(npc.name).toBe('Tharmond');
    expect(npc.profession).toBe('merchant');
  });

  it('should update NPC fields', () => {
    state.setNPC('npc_1', { name: 'A', relationship: 0 });
    const updated = state.updateNPC('npc_1', { relationship: 5, mood: 'happy' });
    expect(updated.relationship).toBe(5);
    expect(updated.mood).toBe('happy');
    expect(state.getNPC('npc_1').relationship).toBe(5);
  });

  it('should return null when updating non-existent NPC', () => {
    expect(state.updateNPC('nope', { x: 1 })).toBeNull();
  });

  it('should get all NPCs', () => {
    state.setNPC('a', { name: 'A' });
    state.setNPC('b', { name: 'B' });
    expect(state.getAllNPCs()).toHaveLength(2);
  });

  it('should persist and reload quests', () => {
    state.setQuest('q1', { type: 'fetch', title: 'Get herbs' });
    state.flush();
    const reloaded = new StateManager();
    reloaded.init();
    expect(reloaded.getQuest('q1').title).toBe('Get herbs');
    expect(reloaded.getAllQuests()).toHaveLength(1);
  });

  it('should add and retrieve events', () => {
    state.addEvent({ type: 'meteor', description: 'shower' });
    state.addEvent({ type: 'festival', description: 'spring' });
    expect(state.getEvents()).toHaveLength(2);
  });

  it('should cap events at 100', () => {
    for (let i = 0; i < 120; i++) {
      state.addEvent({ idx: i });
    }
    expect(state.getEvents()).toHaveLength(100);
    // Most recent 100 retained
    expect(state.getEvents()[0].idx).toBe(20);
  });

  it('should add and retrieve lore', () => {
    state.addLore({ text: 'Ancient ruins...' });
    expect(state.getLore()).toHaveLength(1);
    expect(state.getLore()[0].text).toBe('Ancient ruins...');
  });

  it('should set and get civilizations', () => {
    state.setCivilizations([{ name: 'Old Empire' }]);
    expect(state.getCivilizations()).toHaveLength(1);
  });

  it('should set and get world seed', () => {
    state.setWorldSeed(12345);
    expect(state.getWorldSeed()).toBe(12345);
  });

  it('should clear all state', () => {
    state.setNPC('a', { name: 'A' });
    state.setQuest('q', { title: 'Q' });
    state.addEvent({ type: 'x' });
    state.clear();
    state.flush();
    const reloaded = new StateManager();
    reloaded.init();
    expect(reloaded.getNPC('a')).toBeNull();
    expect(reloaded.getQuest('q')).toBeNull();
    expect(reloaded.getEvents()).toHaveLength(0);
  });

  it('should survive corrupt state file gracefully', () => {
    state.setNPC('a', { name: 'A' });
    state.flush();
    // Corrupt the file
    writeFileSync(_stateFile, '{ broken json');
    const reloaded = new StateManager();
    reloaded.init(); // should not throw
    expect(reloaded.getNPC('a')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// Server-side tests — AIServer (SPEC-085)
// Covers: port 3001 default, WebSocket, message protocol, fallback
// ═══════════════════════════════════════════════════════════

// Helper: connect a WS client and collect all messages from the start.
// Registers the message listener before awaiting 'open' so the ready
// message is never missed.
function connectAndCollect(port) {
  const ws = new WSClient(`ws://localhost:${port}`);
  const messages = [];
  const waiters = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    messages.push(msg);
    const waiter = waiters.shift();
    if (waiter) waiter(msg);
  });
  const ready = new Promise((resolve, reject) => {
    ws.on('error', reject);
    const check = () => {
      if (messages.length > 0) resolve(messages[0]);
      else waiters.push(resolve);
    };
    ws.on('open', check);
  });
  return { ws, messages, ready };
}

// Wait for the Nth message (0-indexed) in a collector.
function waitForNth(collector, n) {
  if (collector.messages.length > n) return Promise.resolve(collector.messages[n]);
  return new Promise(resolve => {
    const handler = () => {
      if (collector.messages.length > n) {
        collector.ws.off('message', handler);
        resolve(collector.messages[n]);
      }
    };
    collector.ws.on('message', handler);
  });
}

describe('AIServer — SPEC-085', () => {
  let server;
  let originalFetch;
  const TEST_PORT = 3098;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Mock fetch so checkOllama doesn't hang on real network
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/tags')) return Promise.resolve({ ok: false });
      return Promise.reject(new Error('no ollama'));
    });
    if (existsSync(_stateFile)) unlinkSync(_stateFile);
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    if (server) {
      server.stop();
      server = null;
    }
    // Give the port a moment to free up
    await new Promise(r => setTimeout(r, 50));
    if (existsSync(_stateFile)) unlinkSync(_stateFile);
  });

  it('should default to port 3001', () => {
    const s = new AIServer();
    expect(s.port).toBe(3001);
  });

  it('should accept custom port', () => {
    const s = new AIServer({ port: 4001 });
    expect(s.port).toBe(4001);
  });

  it('should start and report running', async () => {
    server = new AIServer({ port: TEST_PORT });
    const port = await server.start();
    expect(port).toBe(TEST_PORT);
    expect(server.isRunning()).toBe(true);
  });

  it('should stop cleanly', async () => {
    server = new AIServer({ port: TEST_PORT });
    await server.start();
    server.stop();
    expect(server.isRunning()).toBe(false);
  });

  it('should accept WebSocket client connections', async () => {
    server = new AIServer({ port: TEST_PORT });
    await server.start();
    const { ws, ready } = connectAndCollect(TEST_PORT);
    await ready;
    expect(server.getClientCount()).toBeGreaterThanOrEqual(1);
    ws.close();
    await new Promise(r => setTimeout(r, 50));
  });

  it('should send ready confirmation on connect', async () => {
    server = new AIServer({ port: TEST_PORT });
    await server.start();
    const { ws, ready } = connectAndCollect(TEST_PORT);
    const readyMsg = await ready;
    expect(readyMsg.type).toBe('ready');
    expect(readyMsg).toHaveProperty('ollamaAvailable');
    expect(readyMsg).toHaveProperty('throttleMs');
    ws.close();
  });

  it('should respond to ping with pong', async () => {
    server = new AIServer({ port: TEST_PORT });
    await server.start();
    const { ws, messages } = connectAndCollect(TEST_PORT);
    // Wait for ready (messages[0])
    await new Promise(r => {
      if (messages.length > 0) r();
      else ws.prependOnceListener('message', () => r());
    });
    ws.send(JSON.stringify({ type: 'ping' }));
    // Wait for pong (messages[1])
    const pong = await new Promise(r => {
      if (messages.length > 1) r(messages[1]);
      else ws.prependOnceListener('message', () => r(messages[messages.length - 1]));
    });
    expect(pong.type).toBe('pong');
    ws.close();
  });

  it('should return error for unknown message type', async () => {
    server = new AIServer({ port: TEST_PORT });
    await server.start();
    const { ws, messages } = connectAndCollect(TEST_PORT);
    await new Promise(r => {
      if (messages.length > 0) r();
      else ws.prependOnceListener('message', () => r());
    });
    ws.send(JSON.stringify({ type: 'unknown_type' }));
    const resp = await new Promise(r => {
      if (messages.length > 1) r(messages[1]);
      else ws.prependOnceListener('message', () => r(messages[messages.length - 1]));
    });
    expect(resp.type).toBe('error');
    expect(resp.error).toContain('Unknown message type');
    ws.close();
  });

  it('should handle sync_state and persist NPCs', async () => {
    server = new AIServer({ port: TEST_PORT });
    await server.start();
    const { ws, messages } = connectAndCollect(TEST_PORT);
    await new Promise(r => {
      if (messages.length > 0) r();
      else ws.prependOnceListener('message', () => r());
    });
    ws.send(JSON.stringify({
      type: 'sync_state',
      worldSeed: 999,
      npcs: { npc_1: { name: 'Tharmond' } },
    }));
    const resp = await new Promise(r => {
      if (messages.length > 1) r(messages[1]);
      else ws.prependOnceListener('message', () => r(messages[messages.length - 1]));
    });
    expect(resp.type).toBe('state_synced');
    expect(server.state.getNPC('npc_1').name).toBe('Tharmond');
    expect(server.state.getWorldSeed()).toBe(999);
    ws.close();
  });

  it('should send npc_fallback when LLM unavailable', async () => {
    server = new AIServer({ port: TEST_PORT });
    await server.start();
    const { ws, messages } = connectAndCollect(TEST_PORT);
    await new Promise(r => {
      if (messages.length > 0) r();
      else ws.prependOnceListener('message', () => r());
    });
    ws.send(JSON.stringify({
      type: 'npc_dialogue',
      npcId: 'npc_1',
      npcData: { name: 'Thor', profession: 'smith', personality: 'gruff' },
      playerContext: {},
    }));
    const resp = await new Promise(r => {
      if (messages.length > 1) r(messages[1]);
      else ws.prependOnceListener('message', () => r(messages[messages.length - 1]));
    });
    expect(resp.type).toBe('npc_fallback');
    expect(resp.npcId).toBe('npc_1');
    expect(resp.reason).toBe('llm_unavailable');
    ws.close();
  });

  it('should handle invalid JSON gracefully', async () => {
    server = new AIServer({ port: TEST_PORT });
    await server.start();
    const { ws, messages } = connectAndCollect(TEST_PORT);
    await new Promise(r => {
      if (messages.length > 0) r();
      else ws.prependOnceListener('message', () => r());
    });
    ws.send('not valid json');
    const resp = await new Promise(r => {
      if (messages.length > 1) r(messages[1]);
      else ws.prependOnceListener('message', () => r(messages[messages.length - 1]));
    });
    expect(resp.type).toBe('error');
    ws.close();
  });

  it('should broadcast messages to all clients', async () => {
    server = new AIServer({ port: TEST_PORT });
    await server.start();
    const c1 = connectAndCollect(TEST_PORT);
    const c2 = connectAndCollect(TEST_PORT);
    // Wait for both ready messages
    await Promise.all([c1.ready, c2.ready]);
    server.broadcast({ type: 'test_broadcast', payload: 42 });
    // Broadcast arrives as messages[1] for each client
    const m1 = await new Promise(r => {
      if (c1.messages.length > 1) r(c1.messages[1]);
      else c1.ws.prependOnceListener('message', () => r(c1.messages[c1.messages.length - 1]));
    });
    const m2 = await new Promise(r => {
      if (c2.messages.length > 1) r(c2.messages[1]);
      else c2.ws.prependOnceListener('message', () => r(c2.messages[c2.messages.length - 1]));
    });
    expect(m1.type).toBe('test_broadcast');
    expect(m2.type).toBe('test_broadcast');
    c1.ws.close();
    c2.ws.close();
  });
});
