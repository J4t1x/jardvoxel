// ═══════════════════════════════════════════════════════════
// JardVoxel 7.2 — Multi-Worker Pool (PRD P-04)
// Parallel chunk generation across N workers with priority queue
// ═══════════════════════════════════════════════════════════

export class WorkerPool {
  constructor(workerUrl, numWorkers = 2) {
    this.workerUrl = workerUrl;
    this.numWorkers = numWorkers;
    this.workers = [];
    this.busy = []; // boolean per worker
    this.queue = []; // priority queue: [{ cx, cz, priority, resolve, reject }]
    this._inFlight = new Map(); // key "cx,cz" -> request being processed by a worker
    this._initialized = false;
    this._initErrors = 0;
    this._totalGenerated = 0;
  }

  async init(initData) {
    const maxWorkers = Math.min(this.numWorkers, navigator.hardwareConcurrency || 2);
    for (let i = 0; i < maxWorkers; i++) {
      try {
        const worker = new Worker(this.workerUrl, { type: 'module' });
        const idx = i;
        worker.onmessage = (e) => this._onMessage(idx, e);
        worker.onerror = (err) => this._onError(idx, err);
        worker.postMessage({ type: 'init', ...initData });
        this.workers.push(worker);
        this.busy.push(false);
      } catch (err) {
        console.warn(`WorkerPool: failed to create worker ${i}:`, err);
        this._initErrors++;
      }
    }
    this._initialized = this.workers.length > 0;
    if (!this._initialized) {
      console.warn('WorkerPool: no workers created, will fallback to sync');
    }
    return this.workers.length;
  }

  _onMessage(workerIdx, e) {
    const { cx, cz } = e.data;
    // Find the matching request in the in-flight map
    const key = (cx + 32768) * 65536 + (cz + 32768);
    const req = this._inFlight.get(key);
    if (req) {
      this._inFlight.delete(key);
      // SPEC-074 Bug #2: Clear the timeout since the worker responded
      if (req._timeout) clearTimeout(req._timeout);
      if (!req._cancelled) {
        req.resolve(e.data);
      }
    }
    this.busy[workerIdx] = false;
    this._totalGenerated++;
    this._dispatchNext();
  }

  _onError(workerIdx, err) {
    console.warn(`WorkerPool: worker ${workerIdx} error:`, err.message || err);
    this.busy[workerIdx] = false;
    // Reject any in-flight request for this worker
    for (const [key, req] of this._inFlight) {
      if (req._workerIdx === workerIdx) {
        this._inFlight.delete(key);
        // SPEC-074 Bug #2: Clear the timeout
        if (req._timeout) clearTimeout(req._timeout);
        req.reject(new Error(err.message || 'Worker error'));
      }
    }
    this._dispatchNext();
  }

  _dispatchNext() {
    if (this.queue.length === 0) return;
    // Find a free worker
    let freeIdx = -1;
    for (let i = 0; i < this.busy.length; i++) {
      if (!this.busy[i]) { freeIdx = i; break; }
    }
    if (freeIdx === -1) return;

    // Get highest priority request (lowest priority number)
    // Queue is kept sorted by priority (insertion sort)
    const req = this.queue.shift();
    if (!req) return;

    req._workerIdx = freeIdx;
    const reqKey = (req.cx + 32768) * 65536 + (req.cz + 32768);
    this._inFlight.set(reqKey, req);
    this.busy[freeIdx] = true;
    this.workers[freeIdx].postMessage({ cx: req.cx, cz: req.cz });

    // SPEC-074 Bug #2: Worker timeout — prevents permanent deadlock if a worker
    // hangs silently (no error, no message). 30s is generous for chunk gen.
    req._timeout = setTimeout(() => {
      if (this._inFlight.has(reqKey)) {
        this._inFlight.delete(reqKey);
        this.busy[freeIdx] = false;
        req.reject(new Error(`Worker timeout for chunk ${req.cx},${req.cz}`));
        this._dispatchNext();
      }
    }, 30000);
    req._timeoutKey = reqKey;
  }

  // Request chunk generation. Returns a promise that resolves with chunk data.
  generateChunk(cx, cz, priority = 0) {
    return new Promise((resolve, reject) => {
      // Insert into queue sorted by priority (lower = higher priority)
      const entry = { cx, cz, priority, resolve, reject };
      let inserted = false;
      for (let i = 0; i < this.queue.length; i++) {
        if (this.queue[i].priority > priority) {
          this.queue.splice(i, 0, entry);
          inserted = true;
          break;
        }
      }
      if (!inserted) this.queue.push(entry);

      this._dispatchNext();
    });
  }

  // Cancel all pending requests for a chunk
  cancelChunk(cx, cz) {
    let cancelled = false;
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].cx === cx && this.queue[i].cz === cz) {
        this.queue.splice(i, 1);
        cancelled = true;
      }
    }
    const key = (cx + 32768) * 65536 + (cz + 32768);
    const inFlight = this._inFlight.get(key);
    if (inFlight) {
      inFlight._cancelled = true;
      cancelled = true;
    }
    return cancelled;
  }

  get pendingCount() { return this.queue.length; }
  get activeCount() { return this.busy.filter(b => b).length; }
  get workerCount() { return this.workers.length; }
  get totalGenerated() { return this._totalGenerated; }

  isInitialized() { return this._initialized; }

  setDimension(dimension) {
    for (const w of this.workers) {
      w.postMessage({ type: 'setDimension', dimension });
    }
  }

  // PRD: Broadcast terrain settings to all workers so they stay in sync with UI toggles
  broadcastSettings(settings) {
    for (const w of this.workers) {
      w.postMessage({ type: 'updateSettings', settings });
    }
  }

  dispose() {
    for (const w of this.workers) {
      w.terminate();
    }
    this.workers = [];
    this.busy = [];
    this.queue = [];
    this._inFlight.clear();
    this._initialized = false;
  }
}
