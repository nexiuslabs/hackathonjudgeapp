import type {
  AutosaveQueueStore,
  CreateQueueStoreOptions,
  AutosaveQueueItemInput,
  AutosaveQueueItem,
} from '@/types/autosave';

interface EncryptedPayload {
  iv: number[];
  data: number[];
}

interface PersistedRecord {
  id: string;
  createdAt: number;
  encrypted: EncryptedPayload;
}

const DEFAULT_NAMESPACE = 'hackathonjudgeapp.autosave';
const DEFAULT_MAX_ENTRIES = 50;
const DB_VERSION = 1;
const STORE_NAME = 'queue';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function ensureCrypto(): Crypto {
  if (typeof globalThis === 'undefined' || !globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('Web Crypto API is unavailable in this environment.');
  }

  return globalThis.crypto;
}

function toNumberArray(buffer: ArrayBuffer): number[] {
  return Array.from(new Uint8Array(buffer));
}

function fromNumberArray(source: number[]): ArrayBuffer {
  const view = new Uint8Array(source);
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

async function importAesKey(input: CryptoKey | ArrayBuffer | Uint8Array | string): Promise<CryptoKey> {
  if (input instanceof CryptoKey) {
    return input;
  }

  if (typeof input === 'string') {
    const encoder = new TextEncoder();
    const raw = encoder.encode(input);
    return ensureCrypto().subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  const normalized = input instanceof Uint8Array ? input : new Uint8Array(input);
  return ensureCrypto().subtle.importKey('raw', normalized, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptPayload(payload: AutosaveQueueItem, key: CryptoKey): Promise<EncryptedPayload> {
  const crypto = ensureCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const json = JSON.stringify(payload);
  const encoded = textEncoder.encode(json);
  const buffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return {
    iv: Array.from(iv),
    data: toNumberArray(buffer),
  };
}

async function decryptPayload(record: PersistedRecord, key: CryptoKey): Promise<AutosaveQueueItem> {
  const crypto = ensureCrypto();
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(record.encrypted.iv) },
    key,
    fromNumberArray(record.encrypted.data),
  );
  const json = textDecoder.decode(decryptedBuffer);
  const payload = JSON.parse(json) as AutosaveQueueItem;
  return payload;
}

function sortByCreatedAt(records: PersistedRecord[]): PersistedRecord[] {
  return [...records].sort((a, b) => a.createdAt - b.createdAt);
}

function sanitizeItem(item: AutosaveQueueItemInput): AutosaveQueueItem {
  return {
    ...item,
    createdAt: item.createdAt ?? Date.now(),
  };
}

export function createQueueStore(options: CreateQueueStoreOptions = {}): AutosaveQueueStore {
  const namespace = options.namespace ?? DEFAULT_NAMESPACE;
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  let cryptoKey: CryptoKey | null = null;
  let pendingKeyPromise: Promise<void> | null = null;

  const useIndexedDb = typeof indexedDB !== 'undefined';
  const useLocalStorage = typeof localStorage !== 'undefined';
  const fallbackStorageKey = `${namespace}::queue`;
  const fallbackStore = new Map<string, PersistedRecord>();

  if (!useIndexedDb && useLocalStorage) {
    try {
      const raw = localStorage.getItem(fallbackStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedRecord[];
        for (const entry of parsed) {
          fallbackStore.set(entry.id, entry);
        }
      }
    } catch (error) {
      console.warn('Failed to load autosave fallback storage.', error);
    }
  }

  let dbPromise: Promise<IDBDatabase> | null = null;

  if (useIndexedDb) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(namespace, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
    });
  }

  async function persistFallback(): Promise<void> {
    if (!useLocalStorage) {
      return;
    }

    try {
      const serialized = JSON.stringify(Array.from(fallbackStore.values()));
      localStorage.setItem(fallbackStorageKey, serialized);
    } catch (error) {
      console.warn('Failed to persist autosave fallback storage.', error);
    }
  }

  async function getRecord(id: string): Promise<PersistedRecord | undefined> {
    if (useIndexedDb && dbPromise) {
      const db = await dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result as PersistedRecord | undefined);
        request.onerror = () => reject(request.error ?? new Error('Failed to read from IndexedDB.'));
      });
    }

    return fallbackStore.get(id);
  }

  async function getAllRecords(): Promise<PersistedRecord[]> {
    if (useIndexedDb && dbPromise) {
      const db = await dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as PersistedRecord[]);
        request.onerror = () => reject(request.error ?? new Error('Failed to enumerate IndexedDB records.'));
      });
    }

    return Array.from(fallbackStore.values());
  }

  async function putRecord(record: PersistedRecord): Promise<void> {
    if (useIndexedDb && dbPromise) {
      const db = await dbPromise;
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error ?? new Error('Failed to persist record to IndexedDB.'));
      });
      return;
    }

    fallbackStore.set(record.id, record);
    await persistFallback();
  }

  async function deleteRecord(id: string): Promise<void> {
    if (useIndexedDb && dbPromise) {
      const db = await dbPromise;
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error ?? new Error('Failed to delete record from IndexedDB.'));
      });
      return;
    }

    fallbackStore.delete(id);
    await persistFallback();
  }

  async function clearRecords(): Promise<void> {
    if (useIndexedDb && dbPromise) {
      const db = await dbPromise;
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error ?? new Error('Failed to clear IndexedDB store.'));
      });
      return;
    }

    fallbackStore.clear();
    await persistFallback();
  }

  async function countRecords(): Promise<number> {
    if (useIndexedDb && dbPromise) {
      const db = await dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Failed to count IndexedDB records.'));
      });
    }

    return fallbackStore.size;
  }

  async function pruneIfNeeded(): Promise<void> {
    const count = await countRecords();
    if (count <= maxEntries) {
      return;
    }

    const records = sortByCreatedAt(await getAllRecords());
    const excess = count - maxEntries;
    const toRemove = records.slice(0, excess);
    for (const record of toRemove) {
      await deleteRecord(record.id);
    }
  }

  async function ensureKey(): Promise<CryptoKey> {
    if (!cryptoKey && pendingKeyPromise) {
      await pendingKeyPromise;
    }

    if (!cryptoKey) {
      throw new Error('Autosave encryption key has not been configured.');
    }

    return cryptoKey;
  }

  async function decryptRecord(record: PersistedRecord): Promise<AutosaveQueueItem> {
    const key = await ensureKey();
    const payload = await decryptPayload(record, key);
    return { ...payload, id: record.id, createdAt: record.createdAt };
  }

  const store: AutosaveQueueStore = {
    async enqueue(itemInput) {
      const key = await ensureKey();
      const incoming = sanitizeItem(itemInput);
      const existing = await getRecord(incoming.id);
      const createdAt = existing?.createdAt ?? incoming.createdAt;
      const payload: AutosaveQueueItem = { ...incoming, createdAt };
      const encrypted = await encryptPayload(payload, key);
      await putRecord({ id: payload.id, createdAt, encrypted });
      await pruneIfNeeded();
      return payload;
    },
    async get(id) {
      const record = await getRecord(id);
      if (!record) {
        return null;
      }

      return decryptRecord(record);
    },
    async getAll() {
      const records = await getAllRecords();
      const decrypted = await Promise.all(records.map((record) => decryptRecord(record)));
      return decrypted.sort((a, b) => a.createdAt - b.createdAt);
    },
    async remove(id) {
      await deleteRecord(id);
    },
    async clear() {
      await clearRecords();
    },
    async size() {
      return countRecords();
    },
    async setEncryptionKey(keyInput) {
      pendingKeyPromise = importAesKey(keyInput).then((key) => {
        cryptoKey = key;
      });
      await pendingKeyPromise;
      pendingKeyPromise = null;
    },
    clearEncryptionKey() {
      cryptoKey = null;
      pendingKeyPromise = null;
    },
  };

  if (options.encryptionKey) {
    pendingKeyPromise = importAesKey(options.encryptionKey).then((key) => {
      cryptoKey = key;
    });
  }

  return store;
}

export type { AutosaveQueueStore } from '@/types/autosave';
