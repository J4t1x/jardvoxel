# PRD — JardVoxel LLM Testing Harness

**Fecha**: 2026-06-28
**Autor**: ja
**Estado**: ✅ Completado (v5.0.0-RC3 — 5 specs SPEC-H001 a H005)
**Versión objetivo**: v1.0.0
**Referencia arquitectónica**: Jard Dev Harness (`.devin/`)

---

## Resumen Ejecutivo

JardVoxel 5.0 incluye un AI Server (`ai-server/`) que usa Ollama para 4 tareas de generación: diálogo NPC, quests, eventos emergentes y lore. Actualmente no existe un sistema para evaluar la calidad, latencia y fiabilidad de las respuestas del LLM antes de integrarlas al juego.

Este PRD define un **LLM Testing Harness** inspirado en la arquitectura del Jard Dev Harness (`.devin/`): 9 capas de automatización, patrón PEV (Plan-Execute-Verify), taste invariants, sensores inferenciales y feedback loop. El harness permite benchmarkar modelos locales (gemma3:1b, qwen2.5:3b, etc.) contra las 4 tareas del AI Server con métricas objetivas.

### Tabla de brechas

| ID | Brecha | Impacto | Estado |
|----|--------|---------|--------|
| H-001 | No hay tests para respuestas de NPC dialogue | Alto | No existe |
| H-002 | No hay validación de JSON estructurado para quests/eventos | Alto | No existe |
| H-003 | No hay benchmark de latencia por modelo | Medio | No existe |
| H-004 | No hay detección de alucinaciones en lore | Medio | No existe |
| H-005 | No hay fallback automático cuando el LLM produce basura | Alto | Fallback hardcodeado |
| H-006 | No hay métricas de calidad comparativas entre modelos | Medio | No existe |
| H-007 | `_buildPrompt` añade "max 2 sentences" a todos los prompts, rompiendo JSON y opciones | Crítico | Bug existente |
| H-008 | `_buildPrompt` duplica contexto del NPC (inyectado + en prompt) | Medio | Bug existente |

---

## Arquitectura de Referencia: Jard Dev Harness

El harness `.devin/` es un sistema de regulación y orquestación de 9 capas:

```
┌─────────────────────────────────────────────────────────────┐
│  1. INPUT LAYER          PRD / SDD / Issues                 │
├─────────────────────────────────────────────────────────────┤
│  2. KNOWLEDGE LAYER      Rules / Memories / Decisions       │
├─────────────────────────────────────────────────────────────┤
│  3. PLANNING ENGINE      Spec Parser / Task Decomposer      │
├─────────────────────────────────────────────────────────────┤
│  4. AGENT ORCHESTRATOR   Planner → Coding → Test → Review   │
├─────────────────────────────────────────────────────────────┤
│  5. EXECUTION LAYER      Code Gen / File Edit / Terminal    │
├─────────────────────────────────────────────────────────────┤
│  6. VALIDATION LAYER     Tests / Lint / Security / Build    │
├─────────────────────────────────────────────────────────────┤
│  7. CI/CD INTEGRATION    Build / Deploy / Railway / Vercel  │
├─────────────────────────────────────────────────────────────┤
│  8. OBSERVABILITY        Logs / Metrics / Errors / Perf     │
├─────────────────────────────────────────────────────────────┤
│  9. FEEDBACK LOOP        Error Analyzer / Auto-Fix / Improve│
└─────────────────────────────────────────────────────────────┘
```

### Componentes clave a adaptar

| Componente .devin | Adaptación LLM Harness |
|-------------------|------------------------|
| **Specs SDD** | Test cases por tarea (npc_dialogue, quest, event, lore) |
| **Rules** | Taste invariants para respuestas LLM (longitud, formato, tono) |
| **Agents** | Test runner, quality judge, benchmark analyzer |
| **PEV Pattern** | Plan (seleccionar modelo + tasks) → Execute (query Ollama) → Verify (gates) |
| **Taste Invariants** | Reglas duras: JSON válido, ≤150 tokens, no repeticiones, tono coherente |
| **Inferential Sensors** | LLM-as-judge para coherencia narrativa y creatividad |
| **Drift Detection** | Degradación de calidad entre runs / modelos |
| **Feedback Loop** | Auto-selección de modelo basado en métricas |
| **Steering Loop** | Promoción de patrones de error a reglas preventivas |

---

## Issues conocidos del AI Server

El código existente en `ai-server/llm-interface.js` tiene dos bugs que afectan directamente al harness:

### Bug 1: `_buildPrompt` añade "max 2 sentences" a todos los prompts

`llm-interface.js:102-107` envuelve **todos** los prompts con `Response (max 2 sentences):`. Esto contradice:
- **NPC dialogue**: pide "response and 3-4 player options" — imposible en 2 frases
- **Quests**: pide "Return JSON with: type, title, description, objectives, rewards" — JSON no son 2 frases
- **Events**: pide "Return JSON with: type, description, duration, effects" — mismo conflicto

Con modelos pequeños (gemma3:1b), las instrucciones conflictivas producen texto plano en lugar de JSON estructurado.

### Bug 2: Doble contexto en prompts de NPC

Para NPC dialogue, `_buildPrompt` inyecta contexto del NPC como JSON, y luego el prompt de `server.js` también incluye los datos del NPC en texto plano. El modelo recibe info del NPC **dos veces** en formatos distintos, desperdiciando tokens del límite de 150.

### Solución del harness

El harness usa **prompts propios optimizados** por tarea (ver `harness/prompt-builder.js` en SPEC-H001), sin pasar por `_buildPrompt`. SPEC-H005 incluye fix de `_buildPrompt` para que sea task-aware (sin "max 2 sentences" para quests/events) y elimine la duplicación de contexto.

---

## Arquitectura del LLM Testing Harness

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JARDVOXEL LLM TESTING HARNESS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  1. INPUT LAYER                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Test Cases   │  │  Model List  │  │  Prompts     │               │    │
│  │  │ (4 tareas)   │  │  (Ollama)    │  │  (server.js) │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  2. KNOWLEDGE LAYER                                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │  NPC Profiles│  │  World Context│  │  Baselines   │               │    │
│  │  │  (personalidad│  │  (biomas,    │  │  (respuestas │               │    │
│  │  │   profesión)  │  │   clima, hora)│  │   de calidad)│               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  3. PLANNING ENGINE                                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Task Selector│→ │ Model Picker │→ │ Prompt Builder│               │    │
│  │  │ (4 tareas x  │  │ (lista de    │  │ (context +   │               │    │
│  │  │  N casos)    │  │  modelos)    │  │  prompt)     │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  4. EXECUTION LAYER                                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Ollama Client│  │  Throttle    │  │  Response    │               │    │
│  │  │ (HTTP :11434)│  │  (2s / req)  │  │  Capture     │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  5. VALIDATION LAYER (Hard Gates)                                    │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │    │
│  │  │ JSON Valid │ │ Token Count│ │ Response   │ │ Tone Check │       │    │
│  │  │ (quests/   │ │ (≤150      │ │ Time p95   │ │ (cozy      │       │    │
│  │  │  events)   │ │  tokens)   │ │ (≤2000ms)  │ │  fantasy)  │       │    │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │    │
│  │  ┌────────────┐ ┌────────────┐                                      │    │
│  │  │ No Repeat  │ │ Has Options│                                      │    │
│  │  │ (within    │ │ (3-4 for   │                                      │    │
│  │  │  session)  │ │  dialogue) │                                      │    │
│  │  └────────────┘ └────────────┘                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  6. INFERENTIAL VALIDATION (LLM-as-Judge)                            │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                     │    │
│  │  │ Creativity │  │ Coherence  │  │ Engagement │                     │    │
│  │  │ Score      │  │ Score      │  │ Score      │                     │    │
│  │  │ (1-5)      │  │ (1-5)      │  │ (1-5)      │                     │    │
│  │  └────────────┘  └────────────┘  └────────────┘                     │    │
│  │  ┌────────────┐                                                      │    │
│  │  │ Lore Acc.  │                                                      │    │
│  │  │ Score      │                                                      │    │
│  │  │ (1-5)      │                                                      │    │
│  │  └────────────┘                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  7. REPORTING                                                        │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Per-Model    │  │ Per-Task     │  │ Comparative  │               │    │
│  │  │ Report       │  │ Report       │  │ Matrix       │               │    │
│  │  │ (JSON + MD)  │  │ (JSON + MD)  │  │ (Table)      │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  8. OBSERVABILITY                                                    │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Latency      │  │ Token Usage  │  │ Error Rate   │               │    │
│  │  │ Histogram    │  │ per Response │  │ per Model    │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                        │                                                     │
│                        ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  9. FEEDBACK LOOP                                                    │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Model Ranker │  │ Auto-Switch  │  │ Pattern      │               │    │
│  │  │ (best model  │  │ (fallback if │  │ Detector     │               │    │
│  │  │  per task)   │  │  quality ↓)  │  │ (recurring   │               │    │
│  │  │              │  │              │  │  failures)   │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │                           │                                         │    │
│  │                           ▼                                         │    │
│  │                    Vuelve a Capa 1                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Patrón PEV para LLM Testing

Adaptado del `engine/PEV-PATTERN.md` del Jard Dev Harness.

### Phase 1 — PLAN

```yaml
plan:
  test_run_id: RUN-001
  model: gemma3:1b
  timestamp: <ISO-8601>
  tasks:
    - id: T-001
      type: npc_dialogue
      cases: 10
      npc_profiles: [merchant, guard, scholar, child, elder]
      success_criteria:
        - "Response ≤150 tokens"
        - "3-4 player options included"
        - "Tone: cozy fantasy"
        - "No repeated responses within session"
    - id: T-002
      type: generate_quest
      cases: 10
      contexts: [forest, desert, ocean, cave, village]
      success_criteria:
        - "Valid JSON output"
        - "Has type, title, description, objectives, rewards"
        - "Objectives are actionable"
    - id: T-003
      type: generate_event
      cases: 10
      contexts: [storm, festival, discovery, danger, mystery]
      success_criteria:
        - "Valid JSON output"
        - "Has type, description, duration, effects"
        - "Duration is reasonable (60-600s)"
    - id: T-004
      type: generate_lore
      cases: 10
      contexts: [ancient_ruin, lost_civilization, magical_artifact, hero_tale]
      success_criteria:
        - "Response ≤150 tokens"
        - "Coherent with world context"
        - "No contradictions with provided lore"
```

### Phase 2 — EXECUTE

Para cada task:
1. Construir prompt con `harness/prompt-builder.js` (prompts propios optimizados por tarea, NO `_buildPrompt` del server)
2. Query Ollama via HTTP (`/api/generate`) directamente, sin pasar por `LLMInterface.generate()`
3. Capturar: response text crudo del LLM (sin fallback de server), latency (ms), token count
4. Respetar throttle (2s entre requests)
5. Log estructurado por caso

> **Importante:** El harness evalúa la **respuesta cruda del LLM**, no el output del server con fallback aplicado. `server.js` envuelve texto plano con opciones default (`['Continue...', 'Goodbye.', ...]`) — el harness debe testear si el LLM produce opciones por sí mismo, no si el server las inyecta.

### Phase 3 — VERIFY

**Hard gates obligatorios:**

| Gate | Criterio | Fail action |
|------|---------|-------------|
| `json_valid` | Quests y events parsean como JSON (respuesta cruda del LLM) | Marcar caso como fail |
| `token_count` | ≤`num_predict` tokens (default 150, configurable) | Marcar caso como fail |
| `response_time_p95` | Tiempo de respuesta (request → complete) ≤2000ms en p95 | Marcar modelo como slow |
| `has_options` | NPC dialogue crudo del LLM incluye 3-4 opciones (sin fallback del server) | Marcar caso como fail |
| `no_repeat` | Sin respuestas idénticas en sesión | Marcar caso como fail |
| `tone_check` | No contiene violencia gráfica, lenguaje moderno | Marcar caso como fail |

**Soft gates (inferenciales):**

| Gate | Criterio | Scoring |
|------|---------|---------|
| `creativity` | Respuesta no es genérica/template | 1-5 (LLM-as-judge) |
| `coherence` | Respuesta tiene sentido con contexto | 1-5 (LLM-as-judge) |
| `engagement` | Respuesta invita a interactuar | 1-5 (LLM-as-judge) |
| `lore_accuracy` | No contradice lore establecido | 1-5 (LLM-as-judge) |

**Re-plan loop:** Si hard gate fail rate >30% → re-plan con modelo alternativo.

---

## Taste Invariants para LLM Responses

Inspirado en `rules/taste-invariants.md` — reglas duras, no warnings.

| # | Invariante | Límite | Justificación |
|---|------------|--------|---------------|
| 1 | `max_tokens` | ≤`num_predict` (default 150, configurable) | Configuración del AI Server; respuestas largas rompen el ritmo del juego |
| 2 | `max_response_time` | ≤2000ms p95 | Tiempo de respuesta del LLM (request → complete); >2s causa percepción de lag. No confundir con throttle (tiempo mínimo entre requests) |
| 3 | `min_options` | ≥3 | NPC dialogue sin opciones no es interactivo |
| 4 | `max_options` | ≤4 | Más de 4 opciones abruman al jugador |
| 5 | `json_required` | quests/events | Sin JSON válido, el cliente no puede parsear |
| 6 | `tone_cozy` | siempre | JardVoxel es "cozy fantasy"; no horror, no violence gráfica |

### Banned Patterns (respuestas LLM)

| Patrón | Razón |
|--------|-------|
| "As an AI..." / "I cannot..." | Rompe inmersión |
| Referencias al mundo real | Rompe lore |
| Respuestas >150 tokens | Excede config del server |
| JSON con campos faltantes | Cliente no puede parsear |
| Repetición exacta dentro de sesión | Indica falta de creatividad |
| Lenguaje moderno/slang | No encaja en cozy fantasy |

---

## Estructura del Harness

```
ai-server/
├── llm-interface.js          # Existente — interface con Ollama
├── server.js                 # Existente — WebSocket server
├── state-manager.js          # Existente — state management
├── package.json              # Existente
└── harness/                  # NUEVO — LLM Testing Harness
    ├── README.md             # Documentación del harness
    ├── runner.js             # Test runner principal (PEV orchestrator)
    ├── config.js             # Configuración (modelos, gates, umbrales, num_predict)
    ├── prompt-builder.js     # Prompts propios optimizados por tarea (NO usa _buildPrompt)
    ├── cases/                # Test cases por tarea
    │   ├── npc-dialogue.json     # 10 casos de diálogo NPC
    │   ├── quest-generation.json # 10 casos de quest
    │   ├── event-generation.json # 10 casos de evento
    │   └── lore-generation.json  # 10 casos de lore
    ├── gates/                # Hard gates (validación computacional)
    │   ├── json-validator.js     # JSON válido para quests/events
    │   ├── token-counter.js      # Contar tokens de respuesta
    │   ├── latency-checker.js    # Medir latencia p50/p95/p99
    │   ├── options-checker.js    # 3-4 opciones en diálogo
    │   ├── repeat-detector.js    # Respuestas duplicadas
    │   └── tone-checker.js       # Filtro de tono cozy fantasy
    ├── judges/               # Soft gates (LLM-as-judge inferencial)
    │   ├── creativity-judge.js   # Score creatividad 1-5
    │   ├── coherence-judge.js    # Score coherencia 1-5
    │   ├── engagement-judge.js   # Score engagement 1-5
    │   └── lore-judge.js         # Score accuracy lore 1-5
    ├── reporters/            # Generación de reportes
    │   ├── json-reporter.js      # Reporte JSON estructurado
    │   ├── md-reporter.js        # Reporte Markdown legible
    │   └── comparative.js        # Matriz comparativa entre modelos
    ├── state/                # Estado del harness
    │   ├── baselines.json        # Respuestas de calidad conocida
    │   ├── results/              # Resultados por run (JSON)
    │   └── patterns.json         # Patrones de error detectados
    └── scripts/              # Scripts utilitarios
        ├── run-all.sh            # Ejecutar suite completa
        ├── benchmark-model.sh    # Benchmark un modelo
        └── compare-models.sh     # Comparar modelos
```

---

## Specs

### SPEC-H001: Core Test Runner + Hard Gates

**Prioridad**: Critical
**Estimación**: 6h
**Dependencias**: Ninguna
**Bloquea a**: SPEC-H002, SPEC-H003

#### Problema

No existe forma de ejecutar tests automatizados contra el AI Server. Las respuestas del LLM no se validan antes de llegar al juego.

#### Arquitectura

```
TestRunner
├── loadCases(taskType) → cases/*.json
├── buildPrompt(case, context) → harness/prompt-builder.js
│   ├── npc_dialogue: prompt limpio sin duplicar contexto, pide JSON con text + options
│   ├── generate_quest: prompt pide JSON, sin "max 2 sentences"
│   ├── generate_event: prompt pide JSON, sin "max 2 sentences"
│   └── generate_lore: prompt pide texto narrativo, sin "max 2 sentences"
├── queryOllamaDirect(model, prompt, options) → HTTP /api/generate (sin LLMInterface)
├── runModel(model, cases)
│   ├── for each case:
│   │   ├── buildPrompt(case, context)
│   │   ├── queryOllamaDirect(model, prompt, { num_predict, temperature })
│   │   ├── captureResponse(rawText, latency, tokens) — respuesta cruda, sin fallback
│   │   └── runGates(response)
│   └── aggregateResults()
├── runGates(response)
│   ├── jsonValidator(response, taskType) — valida JSON crudo del LLM
│   ├── tokenCounter(response)
│   ├── responseTimeChecker(response.latency) — request → complete
│   ├── optionsChecker(response, taskType) — valida opciones del LLM, no del server fallback
│   ├── repeatDetector(response, session)
│   └── toneChecker(response)
└── report(results)
```

#### Prompt Builder

El harness usa prompts propios optimizados por tarea. Esto es **crítico** porque `_buildPrompt` en `llm-interface.js:102-107` añade `Response (max 2 sentences):` a todos los prompts, lo que hace imposible generar JSON estructurado o respuestas con opciones.

Ejemplo de prompt propio para quest:
```
You are a quest generator for a cozy fantasy voxel game.
Context: {bioma: "forest", playerLevel: 3, nearbyNPCs: ["merchant"]}

Generate a quest as JSON with this exact structure:
{"type": "fetch|explore|talk|craft", "title": "...", "description": "...", "objectives": [...], "rewards": [...]}

Respond with ONLY the JSON, no other text.
```

#### Criterios de aceptación

- [ ] `harness/runner.js` ejecuta suite completa contra cualquier modelo Ollama
- [ ] `harness/prompt-builder.js` genera prompts propios por tarea (sin `_buildPrompt`)
- [ ] 40 test cases totales (10 por tarea x 4 tareas)
- [ ] 6 hard gates implementados y funcionando
- [ ] Hard gates evalúan respuesta cruda del LLM (sin fallback del server)
- [ ] `num_predict` configurable (default 150, puede overridear a 200/300 para experimentación)
- [ ] Reporte JSON con resultados por caso y por gate
- [ ] Reporte Markdown legible con resumen ejecutivo
- [ ] Throttle de 2s respetado entre requests
- [ ] Manejo de errores: Ollama no disponible, timeout, respuesta vacía
- [ ] CLI: `node harness/runner.js --model gemma3:1b`
- [ ] CLI: `node harness/runner.js --model gemma3:1b --num-predict 200`

---

### SPEC-H002: Inferential Judges (LLM-as-Judge)

**Prioridad**: High
**Estimación**: 5h
**Dependencias**: SPEC-H001
**Bloquea a**: SPEC-H004

#### Problema

Los hard gates validan estructura pero no calidad narrativa. Una respuesta puede pasar todos los hard gates y aún ser genérica o aburrida.

#### Arquitectura

```
JudgeEngine
├── creativityJudge(response, context)
│   ├── Detects: template phrases, generic responses
│   └── Score: 1 (template) → 5 (unique, surprising)
├── coherenceJudge(response, context)
│   ├── Detects: contradictions, non-sequiturs
│   └── Score: 1 (incoherent) → 5 (perfectly contextual)
├── engagementJudge(response, context)
│   ├── Detects: dead-end responses, lack of hooks
│   └── Score: 1 (boring) → 5 (invites interaction)
└── loreJudge(response, worldContext)
    ├── Detects: lore contradictions, anachronisms
    └── Score: 1 (breaks lore) → 5 (enriches lore)
```

#### Implementación

Usar un modelo más capaz (qwen2.5:3b o gemma3:4b) como juez para evaluar respuestas de modelos más pequeños (gemma3:1b). El judge recibe:
- Respuesta del modelo bajo test
- Contexto original (NPC profile, world state)
- Criterio de evaluación (creativity, coherence, etc.)
- Output: score 1-5 + justificación breve

#### Criterios de aceptación

- [ ] 4 judges implementados (creativity, coherence, engagement, lore)
- [ ] Cada judge produce score 1-5 + justificación
- [ ] Judge usa modelo diferente al modelo bajo test
- [ ] Promedio de scores incluido en reporte
- [ ] Umbral configurable: score <3 marca caso como warning
- [ ] CLI: `node harness/runner.js --model gemma3:1b --judge qwen2.5:3b`

---

### SPEC-H003: Comparative Benchmark + Model Ranker

**Prioridad**: High
**Estimación**: 4h
**Dependencias**: SPEC-H001
**Bloquea a**: SPEC-H004

#### Problema

Sin benchmark comparativo no hay forma objetiva de elegir el mejor modelo para cada tarea.

#### Arquitectura

```
BenchmarkRunner
├── runAllModels(models[], cases[])
│   ├── for each model:
│   │   └── TestRunner.runModel(model, cases)
│   └── collectAllResults()
├── compare(results)
│   ├── per-task comparison (npc, quest, event, lore)
│   ├── per-gate pass rate
│   ├── per-judge average score
│   └── latency percentiles (p50, p95, p99)
└── rank(results)
    ├── best_model_per_task
    ├── best_model_overall
    └── recommended_fallback_order
```

#### Output: Matriz comparativa

```
| Model         | NPC Pass | Quest Pass | Event Pass | Lore Pass | Avg Score | p95 Latency |
|---------------|----------|------------|------------|-----------|-----------|-------------|
| gemma3:1b     | 80%      | 60%        | 70%        | 90%       | 3.2/5     | 450ms       |
| qwen2.5:3b    | 90%      | 85%        | 80%        | 85%       | 3.8/5     | 1200ms      |
| gemma3:4b     | 95%      | 75%        | 85%        | 95%       | 4.1/5     | 2100ms      |
```

#### Criterios de aceptación

- [ ] Benchmark ejecuta suite completa contra N modelos en una run
- [ ] Matriz comparativa en formato tabla Markdown
- [ ] Ranking por tarea (best model for NPC, best for quests, etc.)
- [ ] Ranking overall con weighted score
- [ ] Latency percentiles (p50, p95, p99) por modelo
- [ ] Recomendación de fallback order (modelo primario → secundario → templates)
- [ ] CLI: `node harness/runner.js --benchmark --models gemma3:1b,qwen2.5:3b,gemma3:4b`

---

### SPEC-H004: Feedback Loop + Pattern Detector

**Prioridad**: Medium
**Estimación**: 4h
**Dependencias**: SPEC-H002, SPEC-H003
**Bloquea a**: Ninguna

#### Problema

Sin feedback loop, cada benchmark run es aislado. No hay aprendizaje de patrones de error ni auto-ajuste del modelo seleccionado.

#### Arquitectura

```
FeedbackLoop
├── PatternDetector
│   ├── loadHistoricalResults()
│   ├── detectRecurringFailures()
│   │   ├── same gate fail ≥3 times → pattern
│   │   ├── same judge score <3 ≥3 times → pattern
│   │   └── same tone violation ≥2 times → pattern
│   └── promoteToRule(pattern) → harness/rules/
├── ModelRanker
│   ├── trackModelPerformance(model, task, score)
│   ├── detectDegradation(model) → quality drop >20%
│   └── recommendSwitch(model, task) → alternative model
└── AutoSwitch
    ├── if model fails >50% hard gates → switch to fallback
    ├── if judge score <2 for 3 consecutive cases → switch
    └── log switch decision in state/patterns.json
```

#### Steering thresholds (adaptado de .devin)

| Ocurrencias | Acción | Output |
|-------------|--------|--------|
| 1-2 | Log + retry | Caso marcado como warning |
| 3+ | Pattern detectado | Regla preventiva propuesta |
| 5+ | Patrón crítico | Alerta + recomendación de cambio de modelo |
| 10+ | Patrón sistémico | Bloqueo de modelo + auditoría manual |

#### Criterios de aceptación

- [ ] Pattern detector analiza resultados históricos (últimas 5 runs)
- [ ] Reglas preventivas generadas en `harness/state/patterns.json`
- [ ] Model ranker trackea performance por modelo+task
- [ ] Detección de degradación: score promedio baja >20% entre runs
- [ ] Auto-switch: si modelo falla >50% hard gates, recomienda fallback
- [ ] Log de decisiones en `harness/state/decisions.json`
- [ ] CLI: `node harness/runner.js --model gemma3:1b --feedback`

---

### SPEC-H005: Fix `_buildPrompt` + AI Server Integration

**Prioridad**: High
**Estimación**: 5h
**Dependencias**: SPEC-H001
**Bloquea a**: Ninguna

#### Problema

1. `_buildPrompt` en `llm-interface.js:102-107` añade `Response (max 2 sentences):` a **todos** los prompts, haciendo imposible generar JSON estructurado para quests/events o respuestas con opciones para NPC dialogue.
2. `_buildPrompt` duplica contexto del NPC (inyectado como JSON + repetido en el prompt de `server.js`).
3. No hay forma de ejecutar el harness desde el AI Server ni de cambiar modelo en runtime.

#### Cambios

**Fix `_buildPrompt` (Bug H-007, H-008):**
- `ai-server/llm-interface.js`: Hacer `_buildPrompt` task-aware
  - NPC dialogue: sin "max 2 sentences", pedir JSON con `text` y `options`
  - Quests/Events: sin "max 2 sentences", pedir solo JSON
  - Lore: sin "max 2 sentences", pedir texto narrativo
  - Eliminar duplicación de contexto: no inyectar contexto si ya está en el prompt
- Agregar `setModel(model)` (una línea: `this.model = model`)

**Integración:**
- `ai-server/server.js`: Exponer endpoint WebSocket `run_harness` que ejecuta suite y retorna resultados
- `ai-server/package.json`: Agregar script `test:llm` → `node harness/runner.js`
- `harness/config.js`: Leer modelo default desde `llm-interface.js` (single source of truth)

#### Criterios de aceptación

- [ ] `_buildPrompt` no añade "max 2 sentences" para quests/events/NPC
- [ ] `_buildPrompt` no duplica contexto del NPC
- [ ] `LLMInterface.setModel(model)` permite cambio en runtime
- [ ] WebSocket endpoint `run_harness` ejecuta suite y retorna JSON
- [ ] `npm run test:llm` ejecuta harness con modelo default
- [ ] `npm run test:llm -- --model gemma3:1b` override de modelo
- [ ] `npm run test:llm -- --benchmark` modo comparativo
- [ ] Harness no rompe funcionamiento existente del AI Server
- [ ] Resultados persisten en `harness/state/results/` con timestamp
- [ ] Tests existentes del AI Server siguen pasando después del fix

---

## Modelos a Evaluar

Basado en `ollama list` del usuario:

| Modelo | Size | Params | Caso de uso esperado |
|--------|------|--------|----------------------|
| **gemma3:1b** | 815 MB | 1B | Modelo primario (rápido, ligero) |
| qwen2.5:3b | 1.9 GB | 3B | Candidato a primario (mejor JSON) |
| gemma3:4b | 3.3 GB | 4B | Candidato a judge (calidad narrativa) |
| phi4-mini | 2.5 GB | 3.8B | Alternativa para diálogo |
| qwen2.5-coder:3b | 1.9 GB | 3B | No recomendado (código, no narrativa) |
| gemma3:270m | 291 MB | 270M | Baseline mínimo (esperar fallos) |

### Estrategia de evaluación

1. **Fase 1**: gemma3:1b como modelo bajo test, qwen2.5:3b como judge
2. **Fase 2**: Benchmark comparativo: gemma3:1b vs qwen2.5:3b vs gemma3:4b
3. **Fase 3**: gemma3:4b como judge (más capaz) evaluando gemma3:1b y qwen2.5:3b
4. **Fase 4**: Feedback loop con 5+ runs para detectar patrones

---

## Métricas de Éxito

| Métrica | Target | Medición |
|---------|--------|----------|
| Hard gate pass rate (gemma3:1b) | ≥70% | % casos que pasan todos los hard gates (con prompts propios del harness) |
| Hard gate pass rate (qwen2.5:3b) | ≥85% | % casos que pasan todos los hard gates (con prompts propios del harness) |
| Judge score promedio | ≥3.0/5 | Promedio de 4 judges across all cases |
| Latencia p95 (gemma3:1b) | ≤500ms | 95th percentile de latencia |
| Latencia p95 (qwen2.5:3b) | ≤1500ms | 95th percentile de latencia |
| JSON validity rate (quests/events) | ≥80% | % respuestas con JSON parseable |
| Fallback trigger rate | ≤15% | % casos que activan fallback a templates |
| Pattern detection accuracy | ≥80% | Patrones detectados son reales (no falsos positivos) |

---

## Roadmap

| Fase | Spec | Estimación | Dependencia |
|------|------|------------|-------------|
| 1 | SPEC-H001: Core Runner + Hard Gates | 6h | — |
| 2 | SPEC-H005: Fix _buildPrompt + AI Server Integration | 5h | SPEC-H001 |
| 2 | SPEC-H003: Comparative Benchmark | 4h | SPEC-H001 |
| 3 | SPEC-H002: Inferential Judges | 5h | SPEC-H001 |
| 4 | SPEC-H004: Feedback Loop | 4h | SPEC-H002, SPEC-H003 |
| | **Total** | **24h** | |

---

## Referencias

- **Jard Dev Harness**: `.devin/README.md`, `.devin/engine/ARCHITECTURE.md`
- **PEV Pattern**: `.devin/engine/PEV-PATTERN.md`
- **Taste Invariants**: `.devin/rules/taste-invariants.md`
- **Cascade Dev Rules**: `.devin/rules/cascade-dev-rules.md`
- **Skills System**: `.devin/skills/README.md`
- **AI Server**: `ai-server/llm-interface.js`, `ai-server/server.js`
- **PRD Integración 5.0**: `docs/PRD-JARDVOXEL-5.0-INTEGRATION.md` (SPEC-INT-004)

---

## Comandos

```bash
# Ejecutar suite completa con modelo default
npm run test:llm

# Ejecutar con modelo específico
node harness/runner.js --model gemma3:1b

# Benchmark comparativo
node harness/runner.js --benchmark --models gemma3:1b,qwen2.5:3b,gemma3:4b

# Con judges inferenciales
node harness/runner.js --model gemma3:1b --judge qwen2.5:3b

# Con feedback loop
node harness/runner.js --model gemma3:1b --feedback

# Solo una tarea
node harness/runner.js --model gemma3:1b --task npc_dialogue
```

---

*PRD creado: 2026-06-28*
*Referencia: Jard Dev Harness (.devin/) — 9 capas, 23 agentes, PEV pattern*
