import { STORAGE_CONSTANTS } from "../constants/appConfig";

/**
 * IndexedDB 键值封装。IndexedDB 作为主持久层，localStorage 作为同步可读的镜像
 * （关闭页面再打开时优先读 localStorage 秒开，再与 IDB 校对）。
 */
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE_CONSTANTS.IDB_NAME, STORAGE_CONSTANTS.IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORAGE_CONSTANTS.IDB_STORE)) {
        db.createObjectStore(STORAGE_CONSTANTS.IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE_CONSTANTS.IDB_STORE, "readonly");
    const request = tx.objectStore(STORAGE_CONSTANTS.IDB_STORE).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE_CONSTANTS.IDB_STORE, "readwrite");
    tx.objectStore(STORAGE_CONSTANTS.IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
