import type { ShowProject } from "../types/ShowProject";
import type { OperationLog } from "../types/OperationLog";
import { STORE_KEYS, SEEDED_FLAG } from "../constants/storageKeys";
import { idbGetAll, idbPut, idbDelete, idbClear, ensureSeedData } from "../utils/db";

export async function listShowProject(): Promise<ShowProject[]> {
  await ensureSeedData();
  return idbGetAll<ShowProject>(STORE_KEYS.showProject);
}

export async function saveShowProject(payload: ShowProject): Promise<ShowProject> {
  return idbPut(STORE_KEYS.showProject, payload);
}

export async function deleteShowProject(id: string): Promise<void> {
  return idbDelete(STORE_KEYS.showProject, id);
}

export async function listLogs(): Promise<OperationLog[]> {
  return idbGetAll<OperationLog>(STORE_KEYS.log);
}

/** 恢复种子 / 全量导入前清空四个业务仓库（日志保留） */
export async function clearBusinessStores(): Promise<void> {
  await Promise.all([
    idbClear(STORE_KEYS.fixture),
    idbClear(STORE_KEYS.cueScene),
    idbClear(STORE_KEYS.timelineTrack),
    idbClear(STORE_KEYS.showProject)
  ]);
  localStorage.removeItem(SEEDED_FLAG);
}
