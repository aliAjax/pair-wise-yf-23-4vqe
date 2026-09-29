import type { Fixture } from "../types/Fixture";
import { STORE_KEYS } from "../constants/storageKeys";
import { idbGetAll, idbPut, idbDelete, idbPutMany, ensureSeedData } from "../utils/db";

export async function listFixture(): Promise<Fixture[]> {
  await ensureSeedData();
  return idbGetAll<Fixture>(STORE_KEYS.fixture);
}

export async function saveFixture(payload: Fixture): Promise<Fixture> {
  return idbPut(STORE_KEYS.fixture, payload);
}

export async function saveFixtureMany(payload: Fixture[]): Promise<void> {
  return idbPutMany(STORE_KEYS.fixture, payload);
}

export async function deleteFixture(id: string): Promise<void> {
  return idbDelete(STORE_KEYS.fixture, id);
}
