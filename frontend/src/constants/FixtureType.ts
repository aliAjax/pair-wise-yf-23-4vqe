import type { FixtureType } from "../types/FixtureType";

export const FIXTURE_TYPES: readonly FixtureType[] = ["PAR", "SPOT", "WASH", "BEAM", "STROBE"] as const;

export const FixtureTypeText: Record<FixtureType, string> = {
  PAR: "帕灯",
  SPOT: "聚光灯",
  WASH: "染色灯",
  BEAM: "光束灯",
  STROBE: "频闪灯"
};

/** 舞台画布上的字形与光束形态，被 FixtureIcon / StageCanvas / 筛选器共同引用 */
export const FixtureTypeMeta: Record<FixtureType, { glyph: string; beam: "cone" | "flood" | "spot" | "strobe" }> = {
  PAR: { glyph: "PAR", beam: "flood" },
  SPOT: { glyph: "SPT", beam: "spot" },
  WASH: { glyph: "WSH", beam: "flood" },
  BEAM: { glyph: "BEA", beam: "cone" },
  STROBE: { glyph: "STR", beam: "strobe" }
};
