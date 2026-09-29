import type { CueScene } from "../types/CueScene";
import { STORE_KEYS } from "../constants/storageKeys";
import { idbGetAll, idbPut, idbDelete, idbPutMany, ensureSeedData } from "../utils/db";

export async function listCueScene(): Promise<CueScene[]> {
  await ensureSeedData();
  return idbGetAll<CueScene>(STORE_KEYS.cueScene);
}

export async function saveCueScene(payload: CueScene): Promise<CueScene> {
  return idbPut(STORE_KEYS.cueScene, payload);
}

export async function saveCueSceneMany(payload: CueScene[]): Promise<void> {
  return idbPutMany(STORE_KEYS.cueScene, payload);
}

export async function deleteCueScene(id: string): Promise<void> {
  return idbDelete(STORE_KEYS.cueScene, id);
}
