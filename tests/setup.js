import { vi } from 'vitest';

// Mock global de localStorage
const store = new Map();
vi.stubGlobal('localStorage', {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
});

// Mock global de indexedDB
function makeRequest(result) {
  const req = {
    result,
    _onsuccess: null,
    _onerror: null,
    set onsuccess(fn) { this._onsuccess = fn; queueMicrotask(() => { if (this._onsuccess) this._onsuccess({ target: this }); }); },
    set onerror(fn) { this._onerror = fn; },
  };
  return req;
}

const indexedDBMock = {
  _dbs: new Map(),
  open(name, version) {
    const req = {
      result: null,
      _onsuccess: null,
      _onerror: null,
      _onupgradeneeded: null,
      set onsuccess(fn) { this._onsuccess = fn; },
      set onerror(fn) { this._onerror = fn; },
      set onupgradeneeded(fn) { this._onupgradeneeded = fn; },
    };
    const db = {
      _stores: new Map(),
      _storeNames: new Set(),
      objectStoreNames: { contains: (n) => db._storeNames.has(n) },
      createObjectStore(name, opts) {
        db._storeNames.add(name);
        const store = {
          name,
          keyPath: opts.keyPath,
          _data: new Map(),
          put: (value) => {
            const key = value[opts.keyPath];
            store._data.set(key, value);
            return makeRequest(key);
          },
          get: (key) => makeRequest(store._data.get(key) || null),
          getAllKeys: () => makeRequest(Array.from(store._data.keys())),
          clear: () => { store._data.clear(); return makeRequest(undefined); },
        };
        db._stores.set(name, store);
        return store;
      },
      transaction(stores, mode) {
        const tx = {
          _stores: stores,
          objectStore(name) {
            return db._stores.get(name);
          },
          oncomplete: null,
          onerror: null,
        };
        queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
        return tx;
      },
    };
    this._dbs.set(name, db);
    req.result = db;
    queueMicrotask(() => {
      if (req._onupgradeneeded) req._onupgradeneeded({ target: req });
      if (req._onsuccess) req._onsuccess({ target: req });
    });
    return req;
  },
};
vi.stubGlobal('indexedDB', indexedDBMock);

// Mock console.warn para reducir ruido en tests
vi.spyOn(console, 'warn').mockImplementation(() => {});
