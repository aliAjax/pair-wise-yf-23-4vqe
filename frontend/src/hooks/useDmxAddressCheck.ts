import { useMemo } from "react";
import type { Fixture } from "../types/Fixture";
import { findDmxConflict, channelRange, suggestNextDmxAddress } from "../services/FixtureService";
import { DMX_UNIVERSE_SIZE } from "../types/Fixture";

export interface DmxCheckResult {
  /** 与候选灯具冲突的已有灯具 */
  conflict: Fixture | null;
  /** 建议的下一个空闲起始地址 */
  suggestedAddress: number;
  /** 已占用通道（用于通道地图） */
  occupied: { fixture: Fixture; range: [number, number] }[];
  usageRatio: number;
  candidateRange: [number, number];
}

/**
 * DMX 压道检查 hook：灯具布置页新增/编辑灯具时实时反馈冲突，
 * 新灯具的地址不能压到已有通道。
 */
export function useDmxAddressCheck(fixtures: Fixture[], candidate: Fixture): DmxCheckResult {
  return useMemo(() => {
    const conflict = findDmxConflict(candidate, fixtures);
    const occupied = fixtures
      .filter((fixture) => fixture.id !== candidate.id)
      .map((fixture) => ({ fixture, range: channelRange(fixture) }))
      .sort((a, b) => a.range[0] - b.range[0]);
    const usedCount = fixtures.reduce((sum, fixture) => sum + fixture.channel_count, 0);
    return {
      conflict,
      suggestedAddress: suggestNextDmxAddress(fixtures, candidate.color_mode),
      occupied,
      usageRatio: usedCount / DMX_UNIVERSE_SIZE,
      candidateRange: channelRange(candidate)
    };
  }, [fixtures, candidate]);
}
