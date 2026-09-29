import type { CueStatus } from "../../types/CueStatus";
import { CUE_STATUS_TEXT } from "../../constants/CueStatus";

/** 场景状态徽章：状态枚举的展示出口之一（新增状态需同步此组件） */
export function StatusBadge({ value }: { value: CueStatus | string }) {
  return <span className={"badge badge-" + String(value).toLowerCase().replace(/_/g, "-")}>{CUE_STATUS_TEXT[value as CueStatus] ?? String(value)}</span>;
}
