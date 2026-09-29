import type { CueStatus } from "../types/CueStatus";

/** CueStatus 常量侧定义，新增状态需同步类型、日志、错误、筛选器与 StatusBadge */
export const CUE_STATUSES: readonly CueStatus[] = ["DRAFT", "READY", "DISABLED", "ARCHIVED"];

export const CUE_STATUS_TEXT: Record<CueStatus, string> = {
  DRAFT: "草稿",
  READY: "可演出",
  DISABLED: "已停用",
  ARCHIVED: "已归档"
};

/** 只有这些状态的场景允许排上时间轴 / 参与预览叠加 */
export const PLAYABLE_CUE_STATUSES: readonly CueStatus[] = ["READY", "DRAFT"];
