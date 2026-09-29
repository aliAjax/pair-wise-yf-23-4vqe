import { LOG_TEMPLATES, renderLog } from "../constants/logTemplates";
import type { LogEntity } from "../constants/logTemplates";
import { uiApi } from "../stores/redux/store";

/**
 * 所有写操作统一走这里：constants/logTemplates 提供模板，service 提供参数，
 * 最终 dispatch 到 Redux ui 切片并在侧栏“操作日志”中展示。
 */
export function logAction<E extends LogEntity, K extends keyof (typeof LOG_TEMPLATES)[E]>(
  entity: E,
  action: K,
  params: Record<string, string | number> = {}
): void {
  const template = LOG_TEMPLATES[entity][action] as string;
  uiApi.pushLog(entity, renderLog(template, params));
}
