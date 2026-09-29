import type { CueStatus } from "../types/CueStatus";

export const CUE_STATUSES: readonly CueStatus[] = ["DRAFT", "READY", "DISABLED", "ARCHIVED"] as const;

export const CueStatusText: Record<CueStatus, string> = {
  DRAFT: "草稿",
  READY: "就绪",
  DISABLED: "停用",
  ARCHIVED: "归档"
};

/** 徽标配色，StatusBadge 与场景列表筛选器共用 */
export const CueStatusTone: Record<CueStatus, string> = {
  DRAFT: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  READY: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  DISABLED: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  ARCHIVED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/40"
};
