import { useMemo } from "react";
import type { Fixture } from "../types/Fixture";
import { dmxRangeOf, findDmxConflict, type DmxRange } from "../utils/dmx";
import { DMX_UNIVERSE_SIZE } from "../constants/dmx";

export interface DmxAddressCheckResult {
  conflict: Fixture | null;
  occupiedRanges: (DmxRange & { fixture: Fixture })[];
  /** 1-512 每个通道被哪台灯具占用（通道条可视化用） */
  channelOwners: (Fixture | undefined)[];
  totalUsed: number;
  utilization: number;
}

/**
 * DMX 地址校验：新地址压到已有通道时给出冲突灯具，
 * 同时生成整条 universe 的占用表，供灯具布置页通道条与 DmxBadge 使用。
 */
export function useDmxAddressCheck(
  fixtures: Fixture[],
  candidate?: Pick<Fixture, "id" | "dmx_address" | "channel_count"> | null
): DmxAddressCheckResult {
  return useMemo(() => {
    const channelOwners: (Fixture | undefined)[] = new Array(DMX_UNIVERSE_SIZE).fill(undefined);
    const occupiedRanges: (DmxRange & { fixture: Fixture })[] = [];
    let totalUsed = 0;

    fixtures.forEach((fixture) => {
      const range = dmxRangeOf(fixture);
      occupiedRanges.push({ ...range, fixture });
      for (let ch = range.begin; ch <= Math.min(range.end, DMX_UNIVERSE_SIZE); ch += 1) {
        if (!channelOwners[ch - 1]) {
          channelOwners[ch - 1] = fixture;
          totalUsed += 1;
        }
      }
    });

    return {
      conflict: candidate ? findDmxConflict(candidate, fixtures) : null,
      occupiedRanges,
      channelOwners,
      totalUsed,
      utilization: totalUsed / DMX_UNIVERSE_SIZE
    };
  }, [fixtures, candidate]);
}
