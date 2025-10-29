export type AutosaveDraftPayload = {
  eventId: string;
  judgeId: string;
  teamId: string;
  updatedAt: string;
  payloadVersion: number;
  scores: Record<string, number>;
  commentStrength?: string;
  commentImprovement?: string;
  /**
   * @deprecated Replaced by `commentStrength` and `commentImprovement` for Feature F5.
   */
  comments?: Record<string, string>;
} & Record<string, unknown>;

export interface AutosaveQueueItem extends AutosaveDraftPayload {
  id: string;
  createdAt: number;
}

export interface AutosaveQueueMetadata {
  id: string;
  createdAt: number;
  updatedAt: string;
  eventId: string;
  judgeId: string;
  teamId: string;
}

export type AutosaveQueueItemInput = AutosaveDraftPayload & {
  id: string;
  createdAt?: number;
};

export interface AutosaveQueueStore {
  enqueue: (item: AutosaveQueueItemInput) => Promise<AutosaveQueueItem>;
  get: (id: string) => Promise<AutosaveQueueItem | null>;
  getAll: () => Promise<AutosaveQueueItem[]>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  size: () => Promise<number>;
  setEncryptionKey: (key: CryptoKey | ArrayBuffer | Uint8Array | string) => Promise<void>;
  clearEncryptionKey: () => void;
}

export interface CreateQueueStoreOptions {
  namespace?: string;
  maxEntries?: number;
  encryptionKey?: CryptoKey | ArrayBuffer | Uint8Array | string | null;
}
