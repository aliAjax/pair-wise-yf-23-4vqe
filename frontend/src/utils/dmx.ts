import type { Fixture } from "../types/Fixture";
import { DMX_UNIVERSE_SIZE } from "../constants/dmx";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "./errors";

export interface DmxRange {
  begin: number;
  end: number;
}

export function dmxRangeOf(fixture: Pick<Fixture, "dmx_address" | "channel_count">): DmxRange {
  return { begin: fixture.dmx_address, end: fixture.dmx_address + fixture.channel_count - 1 };
}

export function overlaps(a: DmxRange, b: DmxRange): boolean {
  return a.begin <= b.end && b.begin <= a.end;
}

/** 排除自身后找到第一台通道冲突的灯具；无冲突返回 null */
export function findDmxConflict(
  candidate: Pick<Fixture, "id" | "dmx_address" | "channel_count">,
  fixtures: Fixture[]
): Fixture | null {
  const target = dmxRangeOf(candidate);
  return (
    fixtures.find(
      (fixture) => fixture.id !== candidate.id && overlaps(target, dmxRangeOf(fixture))
    ) ?? null
  );
}

/** 创建/保存灯具时调用，越界与压线都直接抛业务异常 */
export function assertDmxAvailable(
  candidate: Pick<Fixture, "id" | "dmx_address" | "channel_count" | "fixture_code">,
  fixtures: Fixture[]
): void {
  if (candidate.dmx_address < 1 || candidate.dmx_address + candidate.channel_count - 1 > DMX_UNIVERSE_SIZE) {
    throw new ServiceError(ERROR_CODES.DMX_ADDRESS_OUT_OF_RANGE, {
      name: candidate.fixture_code,
      count: candidate.channel_count
    });
  }
  const conflict = findDmxConflict(candidate, fixtures);
  if (conflict) {
    const range = dmxRangeOf(conflict);
    throw new ServiceError(ERROR_CODES.DMX_ADDRESS_OVERLAP, {
      start: candidate.dmx_address,
      name: conflict.fixture_code,
      begin: range.begin,
      end: range.end
    });
  }
}

/** 建议下一个空闲起始地址（新增灯具表单默认值用） */
export function suggestNextAddress(fixtures: Fixture[], channelCount: number): number {
  const ranges = fixtures
    .map(dmxRangeOf)
    .sort((a, b) => a.begin - b.begin);
  let cursor = 1;
  for (const range of ranges) {
    if (cursor + channelCount - 1 < range.begin) return cursor;
    cursor = Math.max(cursor, range.end + 1);
  }
  return cursor + channelCount - 1 <= DMX_UNIVERSE_SIZE ? cursor : DMX_UNIVERSE_SIZE;
}
