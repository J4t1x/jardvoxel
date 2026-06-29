import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIClient } from '../core/jardvoxel-survival-ai-client.js';

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
