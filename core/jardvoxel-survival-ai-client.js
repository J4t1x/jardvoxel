// ═══════════════════════════════════════════════════════════
// SPEC-085: AI Client (Browser)
// WebSocket client connecting to AI server (ws://localhost:3001).
// Auto-reconnect with exponential backoff. Graceful degradation.
// ═══════════════════════════════════════════════════════════

const DEFAULT_URL = 'ws://localhost:3001';
const INITIAL_BACKOFF = 1000;
const MAX_BACKOFF = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;

export class AIClient {
  constructor(options = {}) {
    this.url = options.url || DEFAULT_URL;
    this.ws = null;
    this.connected = false;
    this._reconnectAttempts = 0;
    this._backoff = INITIAL_BACKOFF;
    this._reconnectTimer = null;
    this._handlers = new Map();
    this._pendingRequests = new Map();
    this._requestId = 0;
    this._shouldReconnect = true;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.connected = true;
      this._reconnectAttempts = 0;
      this._backoff = INITIAL_BACKOFF;
      this._emit('connected');
    };

    this.ws.onclose = () => {
      this.connected = false;
      this._emit('disconnected');
      if (this._shouldReconnect) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will handle reconnect
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleMessage(msg);
      } catch (e) {
        // Invalid JSON, ignore
      }
    };
  }

  disconnect() {
    this._shouldReconnect = false;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }

  _scheduleReconnect() {
    if (this._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this._emit('reconnect_failed');
      return;
    }

    this._reconnectAttempts++;
    this._reconnectTimer = setTimeout(() => {
      this.connect();
    }, this._backoff);

    // Exponential backoff
    this._backoff = Math.min(this._backoff * 2, MAX_BACKOFF);
  }

  _handleMessage(msg) {
    // Handle response to pending request
    if (msg._requestId && this._pendingRequests.has(msg._requestId)) {
      const callback = this._pendingRequests.get(msg._requestId);
      this._pendingRequests.delete(msg._requestId);
      callback(msg);
      return;
    }

    // Emit to registered handlers
    this._emit(msg.type, msg);
  }

  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
    }
    this._handlers.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  }

  _emit(event, data) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(data); } catch (e) {}
      }
    }
  }

  send(msg) {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.ws.send(JSON.stringify(msg));
      return true;
    } catch (e) {
      return false;
    }
  }

  request(msg, timeout = 5000) {
    return new Promise((resolve) => {
      const id = ++this._requestId;
      const enriched = { ...msg, _requestId: id };

      if (!this.connected) {
        resolve({ type: 'fallback', reason: 'not_connected' });
        return;
      }

      const timer = setTimeout(() => {
        this._pendingRequests.delete(id);
        resolve({ type: 'fallback', reason: 'timeout' });
      }, timeout);

      this._pendingRequests.set(id, (response) => {
        clearTimeout(timer);
        resolve(response);
      });

      if (!this.send(enriched)) {
        this._pendingRequests.delete(id);
        clearTimeout(timer);
        resolve({ type: 'fallback', reason: 'send_failed' });
      }
    });
  }

  // === High-level API ===

  async requestNPCDialogue(npcId, npcData, playerContext) {
    return this.request({
      type: 'npc_dialogue',
      npcId,
      npcData,
      playerContext,
    });
  }

  async requestQuest(context) {
    return this.request({
      type: 'generate_quest',
      context,
    });
  }

  async requestEvent(context) {
    return this.request({
      type: 'generate_event',
      context,
    });
  }

  async requestLore(context) {
    return this.request({
      type: 'generate_lore',
      context,
    });
  }

  syncState(data) {
    return this.send({
      type: 'sync_state',
      ...data,
    });
  }

  getReconnectAttempts() {
    return this._reconnectAttempts;
  }

  getBackoff() {
    return this._backoff;
  }
}
