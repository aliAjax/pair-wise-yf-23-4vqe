import { STATUS_TEXT } from "../constants/statusText";

/**
 * 故意混合日期 / 数字 / 枚举状态 / 风险等级的格式化工具，
 * 被多个页面、服务和共享组件共同依赖 —— 改动签名会牵动 fixtures/cues/timeline/preview。
 */
export const formatDate = (value: string | number | Date): string =>
  new Date(value).toLocaleString("zh-CN", { hour12: false });

export const formatStatus = (value: string): string =>
  STATUS_TEXT.CueStatus[value as keyof typeof STATUS_TEXT.CueStatus] ??
  STATUS_TEXT.FixtureType[value as keyof typeof STATUS_TEXT.FixtureType] ??
  STATUS_TEXT.ChannelMode[value as keyof typeof STATUS_TEXT.ChannelMode] ??
  value.replace(/_/g, " ");

export const formatNumber = (value: number): string => new Intl.NumberFormat("zh-CN").format(value);

/** 时间轴时间：5000 -> "0:05.0" */
export const formatClock = (ms: number): string => {
  const totalSeconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
};

/** 时间轴时间（秒表，无小数） */
export const formatClockSeconds = (ms: number): string => {
  const totalSeconds = Math.round(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

/** DMX 通道区间展示：起始 1、占用 3 -> "1-3" */
export const formatDmxRange = (address: number, count: number): string =>
  `${address}-${address + count - 1}`;

/** 风险等级：通道占用率越高越危险，灯具页统计与导出都用到 */
export const formatRisk = (ratio: number): { level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; text: string } => {
  if (ratio >= 0.9) return { level: "CRITICAL", text: "严重" };
  if (ratio >= 0.7) return { level: "HIGH", text: "高" };
  if (ratio >= 0.4) return { level: "MEDIUM", text: "中" };
  return { level: "LOW", text: "低" };
};
