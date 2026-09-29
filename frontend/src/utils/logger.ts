import { LOG_TEMPLATES } from "../constants/logTemplates";
import type { OperationAction, OperationEntity, OperationLog } from "../types/OperationLog";
import { idbPut } from "./db";
import { STORE_KEYS } from "../constants/storageKeys";
import { createId } from "./id";

function render(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] === undefined ? `{${key}}` : String(params[key])
  );
}

/** 所有写操作都走这里：先按模板渲染，再落 IndexedDB + 控制台 */
export async function writeLog(
  entity: OperationEntity,
  action: OperationAction,
  params: Record<string, string | number> = {}
): Promise<OperationLog> {
  const template = LOG_TEMPLATES[entity][action];
  const entry: OperationLog = {
    id: createId("log"),
    entity,
    action,
    message: template ? render(template, params) : `${entity}.${action}`,
    created_at: new Date().toISOString()
  };
  try {
    await idbPut(STORE_KEYS.log, entry);
  } catch {
    // 日志落库失败不阻断主流程，仅在控制台保留痕迹。
  }
  console.info(`[${entry.entity}] ${entry.message}`);
  return entry;
}
