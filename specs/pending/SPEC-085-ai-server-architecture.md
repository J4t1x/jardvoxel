---
spec_id: SPEC-085
title: "AI Server Architecture"
priority: critical
estimated_time: 20h
depends_on: []
status: pending
phase: 5
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-085: AI Server Architecture

## Description

Decoupled AI server (Node.js, port 3001) with WebSocket bidirectional communication. Supports Ollama (local) and Cloud API (optional). Throttling, fallback to templates, persistent state.

## Requirements

### AI Server (Node.js)
- WebSocket server on port 3001
- LLM Interface: Ollama (local, Apple Silicon) + Cloud API (optional fallback)
- State Manager: NPC memory, quests, events (SQLite or JSON persistence)
- Lore Generator: integrates with procedural lore system
- Quest Generator: dynamic quest creation based on context

### Protocol
- Game → AI: world state, player position, nearby NPCs, events (JSON)
- AI → Game: NPC responses, new quests, generated events, lore (JSON)
- Throttling: max 1 request/2s to avoid LLM overload
- Fallback: if AI server unavailable, NPCs use pre-generated template dialogue

### Client Integration
- WebSocket client in browser (connects to ws://localhost:3001)
- Auto-reconnect with exponential backoff
- Graceful degradation: game works fully without AI server
- State sync: game sends minimal context (delta updates)

### Recommended Models
- Local: Llama 3.2 3B (Ollama)
- Cloud: GPT-4o-mini (optional)

## Acceptance Criteria

- [ ] AI server runs on port 3001 with WebSocket
- [ ] Ollama integration works (local LLM)
- [ ] Cloud API fallback (optional)
- [ ] Throttling: max 1 request/2s
- [ ] Fallback to templates when server unavailable
- [ ] Auto-reconnect with backoff
- [ ] Game works without AI server
- [ ] State persistence (SQLite or JSON)
- [ ] No console errors

## Files to Create

- **Create:** `ai-server/server.js` (WebSocket server)
- **Create:** `ai-server/llm-interface.js` (Ollama + Cloud)
- **Create:** `ai-server/state-manager.js` (persistence)
- **Create:** `ai-server/package.json`
- **Create:** `core/jardvoxel-survival-ai-client.js` (browser WebSocket client)
- **Create:** `tests/ai-server.test.js`
