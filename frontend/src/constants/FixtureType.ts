import type { FixtureType } from "../types/FixtureType";

/** FixtureType 常量侧定义，新增灯具类型需同步 types/FixtureType、日志/错误/筛选/图标等文件 */
export const FIXTURE_TYPES: readonly FixtureType[] = ["PAR", "SPOT", "WASH", "BEAM", "STROBE"];

export const FIXTURE_TYPE_TEXT: Record<FixtureType, string> = {
  PAR: "帕灯",
  SPOT: "聚光灯",
  WASH: "染色灯",
  BEAM: "光束灯",
  STROBE: "频闪灯"
};
