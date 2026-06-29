// ═══════════════════════════════════════════════════════════
// SPEC-085: AI Server — LLM Interface
// Supports Ollama (local) and Cloud API (optional fallback).
// Throttled to max 1 request/2s.
// ═══════════════════════════════════════════════════════════

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma3:1b';
const THROTTLE_MS = 2000;

export { DEFAULT_MODEL };

export class LLMInterface {
  constructor(options = {}) {
    this.ollamaUrl = options.ollamaUrl || DEFAULT_OLLAMA_URL;
    this.model = options.model || DEFAULT_MODEL;
    this.cloudApiKey = options.cloudApiKey || null;
    this.cloudApiUrl = options.cloudApiUrl || null;
    this._lastRequestTime = 0;
    this._queue = [];
    this._processing = false;
  }

  async generate(prompt, context = {}, options = {}) {
    // Throttle: max 1 request / 2s
    const now = Date.now();
    const elapsed = now - this._lastRequestTime;
    if (elapsed < THROTTLE_MS) {
      const wait = THROTTLE_MS - elapsed;
      await new Promise(resolve => setTimeout(resolve, wait));
    }
    this._lastRequestTime = Date.now();

    const taskType = options.taskType || 'npc_dialogue';
    const numPredict = options.numPredict || 150;

    // Try Ollama first
    try {
      const result = await this._queryOllama(prompt, context, taskType, numPredict);
      if (result) return result;
    } catch (e) {
      // Fall through to cloud
    }

    // Try Cloud API if configured
    if (this.cloudApiKey && this.cloudApiUrl) {
      try {
        const result = await this._queryCloud(prompt, context, taskType);
        if (result) return result;
      } catch (e) {
        // Fall through to fallback
      }
    }

    // Fallback: return null (caller uses templates)
    return null;
  }

  async _queryOllama(prompt, context, taskType, numPredict) {
    const body = {
      model: this.model,
      prompt: this._buildPrompt(prompt, context, taskType),
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: numPredict || 150,
      },
    };

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const data = await response.json();
    return data.response || null;
  }

  async _queryCloud(prompt, context, taskType) {
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this._buildSystemPrompt(context, taskType) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    };

    const response = await fetch(`${this.cloudApiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.cloudApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Cloud API HTTP ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  }

  _buildPrompt(prompt, context, taskType) {
    // Task-aware prompt building — no more "max 2 sentences" for structured tasks
    const ctxStr = Object.entries(context)
      .filter(([k, v]) => v != null)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join('\n');

    const ctxBlock = ctxStr ? `Context:\n${ctxStr}\n\n` : '';

    switch (taskType) {
      case 'generate_quest':
        return `${ctxBlock}${prompt}\n\nRespond with ONLY valid JSON, no other text.`;
      case 'generate_event':
        return `${ctxBlock}${prompt}\n\nRespond with ONLY valid JSON, no other text.`;
      case 'generate_lore':
        return `${ctxBlock}${prompt}\n\nRespond with evocative narrative text (max 3 sentences).`;
      case 'npc_dialogue':
      default:
        return `${ctxBlock}${prompt}\n\nRespond as JSON: {"text": "...", "options": ["...", "...", "..."], "relationshipChange": 0}`;
    }
  }

  _buildSystemPrompt(context, taskType) {
    const base = 'You are an AI assistant for a cozy fantasy voxel game called JardVoxel.';
    switch (taskType) {
      case 'generate_quest':
        return `${base} Generate quests as valid JSON with fields: type, title, description, objectives, rewards.`;
      case 'generate_event':
        return `${base} Generate emergent events as valid JSON with fields: type, description, duration, effects.`;
      case 'generate_lore':
        return `${base} Generate atmospheric lore text. Keep it cozy, evocative, and brief.`;
      case 'npc_dialogue':
      default:
        return `${base} You are an NPC. Respond in character as JSON with: text, options (3-4), relationshipChange. Be warm and engaging.`;
    }
  }

  setModel(model) {
    this.model = model;
  }

  isAvailable() {
    return this._ollamaAvailable || !!this.cloudApiKey;
  }

  async checkOllama() {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, { method: 'GET' });
      this._ollamaAvailable = response.ok;
      return response.ok;
    } catch (e) {
      this._ollamaAvailable = false;
      return false;
    }
  }

  getThrottleMs() {
    return THROTTLE_MS;
  }
}
