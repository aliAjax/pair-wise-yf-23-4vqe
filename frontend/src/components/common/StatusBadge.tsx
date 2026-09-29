import type { CueStatus } from "../../types/CueStatus";
import { CueStatusText, CueStatusTone } from "../../constants/CueStatus";

/** 场景状态徽标，文案/配色取自 constants/CueStatus，筛选器与详情共用 */
export function StatusBadge({ value }: { value: CueStatus | string }) {
  const status = value as CueStatus;
  const tone = CueStatusTone[status] ?? "border-edge bg-panel2 text-slate-400";
  const text = CueStatusText[status] ?? String(value);
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>
      {text}
    </span>
  );
}
