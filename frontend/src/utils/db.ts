import { DB_NAME, DB_VERSION, STORE_KEYS, SEEDED_FLAG } from "../constants/storageKeys";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "./errors";
import { seedData } from "../mocks/seedData";

let dbPromise: Promise<IDBDatabase> | null = null;
/** 四个业务仓库必须在同一次引导里一起播种，避免并行加载互相跳过种子 */
let seedPromise: Promise<void> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new ServiceError(ERROR_CODES.STORAGE_UNAVAILABLE, { field: "indexedDB 未定义" }));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      Object.values(STORE_KEYS).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

/** 首启播种：一个事务内写满四个仓库，成功后再打标记 */
export function ensureSeedData(): Promise<void> {
  if (localStorage.getItem(SEEDED_FLAG)) return Promise.resolve();
  if (!seedPromise) {
    seedPromise = openDb().then(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(
            [STORE_KEYS.fixture, STORE_KEYS.cueScene, STORE_KEYS.timelineTrack, STORE_KEYS.showProject],
            "readwrite"
          );
          transaction.objectStore(STORE_KEYS.fixture).clear();
          transaction.objectStore(STORE_KEYS.cueScene).clear();
          transaction.objectStore(STORE_KEYS.timelineTrack).clear();
          transaction.objectStore(STORE_KEYS.showProject).clear();
          seedData.fixture.forEach((row) => transaction.objectStore(STORE_KEYS.fixture).put(row));
          seedData.cueScene.forEach((row) => transaction.objectStore(STORE_KEYS.cueScene).put(row));
          seedData.timelineTrack.forEach((row) => transaction.objectStore(STORE_KEYS.timelineTrack).put(row));
          seedData.showProject.forEach((row) => transaction.objectStore(STORE_KEYS.showProject).put(row));
          transaction.oncomplete = () => {
            localStorage.setItem(SEEDED_FLAG, "1");
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        })
    );
    seedPromise.catch(() => {
      seedPromise = null;
    });
  }
  return seedPromise;
}

export async function idbGetAll<T>(store: string): Promise<T[]> {
  return tx<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);
}

export async function idbPut<T>(store: string, value: T): Promise<T> {
  await tx(store, "readwrite", (s) => s.put(value));
  return value;
}

export async function idbPutMany<T>(store: string, values: T[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, "readwrite");
    const objectStore = transaction.objectStore(store);
    values.forEach((value) => objectStore.put(value));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function idbDelete(store: string, id: string): Promise<void> {
  await tx(store, "readwrite", (s) => s.delete(id));
}

export async function idbClear(store: string): Promise<void> {
  await tx(store, "readwrite", (s) => s.clear());
}
