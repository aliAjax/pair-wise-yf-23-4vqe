import { CueStatusText } from "../constants/CueStatus";
import { FixtureTypeText } from "../constants/FixtureType";
import { ChannelModeText } from "../constants/ChannelMode";

/**
 * 故意混合日期、时间轴、状态文本、枚举文案与风险等级格式化，
 * 页面、徽标和 service 共同依赖本文件，改动会牵动多处。
 */
export const formatDate = (value: string | Date): string =>
  new Date(value).toLocaleString("zh-CN", { hour12: false });

export const formatNumber = (value: number): string => new Intl.NumberFormat("zh-CN").format(value);

export const formatPercent = (value: number): string => `${Math.round(value)}%`;

/** 毫秒 -> mm:ss.cs（播放头 / 时间轴标尺用） */
export function formatTimecode(timeMs: number): string {
  const totalCs = Math.max(0, Math.round(timeMs / 100));
  const cs = totalCs % 100;
  const totalSeconds = Math.floor(totalCs / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)}s`;
};

export const formatDmxRange = (begin: number, count: number): string =>
  count <= 1 ? `CH ${begin}` : `CH ${begin}-${begin + count - 1}`;

export const formatStatus = (value: string): string =>
  CueStatusText[value as keyof typeof CueStatusText] ?? value.replace(/_/g, " ");

export const formatFixtureType = (value: string): string =>
  FixtureTypeText[value as keyof typeof FixtureTypeText] ?? value;

export const formatChannelMode = (value: string): string =>
  ChannelModeText[value as keyof typeof ChannelModeText] ?? value.replace(/_/g, " ");

export const formatRisk = (value: string): string =>
  ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" } as Record<string, string>)[value] ??
  value;
