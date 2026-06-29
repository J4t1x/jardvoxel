// ═══════════════════════════════════════════════════════════
// SPEC-085: AI Server — WebSocket Server
// Decoupled AI server on port 3001 with bidirectional communication.
// Handles: NPC dialogue, quest generation, event creation, lore.
// ═══════════════════════════════════════════════════════════

import { WebSocketServer } from 'ws';
import { LLMInterface } from './llm-interface.js';
import { StateManager } from './state-manager.js';

const DEFAULT_PORT = 3001;

export class AIServer {
  constructor(options = {}) {
    this.port = options.port || DEFAULT_PORT;
    this.wss = null;
    this.llm = new LLMInterface({
      ollamaUrl: options.ollamaUrl,
      model: options.model,
      cloudApiKey: options.cloudApiKey,
      cloudApiUrl: options.cloudApiUrl,
    });
    this.state = new StateManager();
    this._clients = new Set();
    this._running = false;
  }

  async start() {
    this.state.init();
    await this.llm.checkOllama();

    this.wss = new WebSocketServer({ port: this.port });
    this._running = true;

    this.wss.on('connection', (ws) => {
      this._clients.add(ws);
      this._handleConnection(ws);
    });

    return this.port;
  }

  stop() {
    this._running = false;
    if (this.wss) {
      for (const client of this._clients) {
        try { client.close(); } catch (e) {}
      }
      this.wss.close();
      this.wss = null;
    }
    this.state.flush();
  }

  isRunning() {
    return this._running;
  }

  getClientCount() {
    return this._clients.size;
  }

  _handleConnection(ws) {
    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        await this._handleMessage(ws, msg);
      } catch (e) {
        this._send(ws, { type: 'error', error: e.message });
      }
    });

    ws.on('close', () => {
      this._clients.delete(ws);
    });

    ws.on('error', () => {
      this._clients.delete(ws);
    });

    // Send ready confirmation
    this._send(ws, {
      type: 'ready',
      ollamaAvailable: this.llm._ollamaAvailable,
      throttleMs: this.llm.getThrottleMs(),
    });
  }

  async _handleMessage(ws, msg) {
    switch (msg.type) {
      case 'npc_dialogue':
        await this._handleNPCDialogue(ws, msg);
        break;
      case 'generate_quest':
        await this._handleGenerateQuest(ws, msg);
        break;
      case 'generate_event':
        await this._handleGenerateEvent(ws, msg);
        break;
      case 'generate_lore':
        await this._handleGenerateLore(ws, msg);
        break;
      case 'run_harness':
        await this._handleRunHarness(ws, msg);
        break;
      case 'sync_state':
        this._handleSyncState(ws, msg);
        break;
      case 'ping':
        this._send(ws, { type: 'pong' });
        break;
      default:
        this._send(ws, { type: 'error', error: `Unknown message type: ${msg.type}` });
    }
  }

  async _handleNPCDialogue(ws, msg) {
    const { npcId, npcData, playerContext } = msg;
    const npc = this.state.getNPC(npcId) || npcData;

    // SPEC-H005: NPC data in prompt text, playerContext via context object (no duplication)
    const prompt = `NPC: ${npc.name} (${npc.profession}, ${npc.personality})
Mood: ${npc.mood || 'neutral'}
Relationship: ${npc.relationship || 0}

Generate a response and 3-4 player options.`;

    const response = await this.llm.generate(prompt, {
      playerContext: playerContext || {},
    }, { taskType: 'npc_dialogue' });

    if (response) {
      // Try to parse structured response, fallback to plain text
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        parsed = {
          text: response,
          options: ['Continue...', 'Goodbye.', 'Tell me more.', 'I have a question.'],
          relationshipChange: 0,
        };
      }
      this._send(ws, { type: 'npc_response', npcId, ...parsed });
    } else {
      // Fallback: signal template mode
      this._send(ws, { type: 'npc_fallback', npcId, reason: 'llm_unavailable' });
    }
  }

  async _handleGenerateQuest(ws, msg) {
    const { context } = msg;
    // SPEC-H005: Context passed via context object only, not in prompt text
    const prompt = `Generate a quest for the player.\nReturn JSON with: type, title, description, objectives, rewards.`;

    const response = await this.llm.generate(prompt, context, { taskType: 'generate_quest' });

    if (response) {
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        parsed = { type: 'fetch', title: 'Errand', description: response, objectives: [], rewards: [] };
      }
      this._send(ws, { type: 'quest_generated', quest: parsed });
    } else {
      this._send(ws, { type: 'quest_fallback', reason: 'llm_unavailable' });
    }
  }

  async _handleGenerateEvent(ws, msg) {
    const { context } = msg;
    // SPEC-H005: Context passed via context object only, not in prompt text
    const prompt = `Generate an emergent event.\nReturn JSON with: type, description, duration, effects.`;

    const response = await this.llm.generate(prompt, context, { taskType: 'generate_event' });

    if (response) {
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        parsed = { type: 'random', description: response, duration: 300, effects: [] };
      }
      this.state.addEvent(parsed);
      this._send(ws, { type: 'event_generated', event: parsed });
    } else {
      this._send(ws, { type: 'event_fallback', reason: 'llm_unavailable' });
    }
  }

  async _handleGenerateLore(ws, msg) {
    const { context } = msg;
    // SPEC-H005: Context passed once via context object, not in prompt text
    const prompt = `Generate lore text for this location or subject.`;

    const response = await this.llm.generate(prompt, context, { taskType: 'generate_lore' });

    if (response) {
      const lore = { text: response, context, timestamp: Date.now() };
      this.state.addLore(lore);
      this._send(ws, { type: 'lore_generated', lore });
    } else {
      this._send(ws, { type: 'lore_fallback', reason: 'llm_unavailable' });
    }
  }

  async _handleRunHarness(ws, msg) {
    const { exec } = await import('child_process');
    const model = msg.model || this.llm.model;
    const task = msg.task || '';
    const numPredict = msg.numPredict || 150;
    const judge = msg.judge || '';
    const benchmark = msg.benchmark || false;
    const models = msg.models || '';
    const feedback = msg.feedback || false;

    let cmd = `node harness/runner.js --model ${model} --num-predict ${numPredict}`;
    if (task) cmd += ` --task ${task}`;
    if (judge) cmd += ` --judge ${judge}`;
    if (benchmark && models) cmd += ` --benchmark --models ${models}`;
    if (feedback) cmd += ` --feedback`;

    this._send(ws, { type: 'harness_started', command: cmd });

    exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        this._send(ws, { type: 'harness_error', error: error.message, stderr: stderr.substring(0, 1000) });
        return;
      }
      this._send(ws, {
        type: 'harness_complete',
        output: stdout.substring(0, 5000),
        stderr: stderr ? stderr.substring(0, 1000) : '',
      });
    });
  }

  _handleSyncState(ws, msg) {
    if (msg.worldSeed !== undefined) {
      this.state.setWorldSeed(msg.worldSeed);
    }
    if (msg.npcs) {
      for (const [id, data] of Object.entries(msg.npcs)) {
        this.state.setNPC(id, data);
      }
    }
    this._send(ws, { type: 'state_synced' });
  }

  _send(ws, msg) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  broadcast(msg) {
    const data = JSON.stringify(msg);
    for (const client of this._clients) {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    }
  }
}

// === CLI entry point ===
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  const server = new AIServer();
  server.start().then((port) => {
    console.log(`JardVoxel AI Server running on port ${port}`);
    console.log(`Ollama available: ${server.llm._ollamaAvailable}`);
  }).catch((e) => {
    console.error('Failed to start AI server:', e);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
  });
}
