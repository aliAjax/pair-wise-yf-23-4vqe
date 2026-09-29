import type { Fixture } from "../types/Fixture";
import { FIXTURE_CODE_PATTERN, DMX_UNIVERSE_SIZE } from "../types/Fixture";
import type { ChannelMode } from "../types/ChannelMode";
import { CHANNEL_MODE_OCCUPANCY } from "../constants/ChannelMode";
import { ERROR_CODES } from "../constants/errorCodes";
import { formatErrorMessage } from "../constants/errorMessages";
import { BusinessError } from "./BusinessError";
import { logAction } from "./logger";
import { formatDmxRange } from "../utils/formatters";
import { createDefaultFixture } from "../constructors/FixtureConstructor";

/** 通道占用区间 [start, end]，end 含 */
export function channelRange(fixture: Pick<Fixture, "dmx_address" | "channel_count">): [number, number] {
  return [fixture.dmx_address, fixture.dmx_address + fixture.channel_count - 1];
}

export function channelsOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
}

/** 找到与目标灯具压道的已有灯具（排除自身 id） */
export function findDmxConflict(fixture: Fixture, fixtures: Fixture[]): Fixture | null {
  const target = channelRange(fixture);
  for (const other of fixtures) {
    if (other.id === fixture.id) continue;
    if (channelsOverlap(target, channelRange(other))) return other;
  }
  return null;
}

/** 校验灯具表单，返回错误消息数组（空数组表示通过） */
export function validateFixture(fixture: Fixture, fixtures: Fixture[]): string[] {
  const errors: string[] = [];
  if (!FIXTURE_CODE_PATTERN.test(fixture.fixture_code)) {
    errors.push(formatErrorMessage(ERROR_CODES.VALIDATION_FAILED, { field: "灯具编号需为 1-24 位字母数字/中划线" }));
  }
  if (fixtures.some((f) => f.id !== fixture.id && f.fixture_code === fixture.fixture_code)) {
    errors.push(formatErrorMessage(ERROR_CODES.FIXTURE_CODE_DUPLICATED, { code: fixture.fixture_code }));
  }
  if (fixture.dmx_address < 1 || fixture.dmx_address + fixture.channel_count - 1 > DMX_UNIVERSE_SIZE) {
    errors.push(
      formatErrorMessage(ERROR_CODES.DMX_ADDRESS_OUT_OF_RANGE, {
        address: fixture.dmx_address,
        count: fixture.channel_count
      })
    );
  }
  const conflict = findDmxConflict(fixture, fixtures);
  if (conflict) {
    errors.push(
      formatErrorMessage(ERROR_CODES.DMX_ADDRESS_CONFLICT, {
        address: fixture.dmx_address,
        code: conflict.fixture_code,
        range: formatDmxRange(conflict.dmx_address, conflict.channel_count)
      })
    );
  }
  if (fixture.position_x < 0 || fixture.position_x > 100 || fixture.position_y < 0 || fixture.position_y > 100) {
    errors.push(formatErrorMessage(ERROR_CODES.VALIDATION_FAILED, { field: "舞台坐标需在 0-100 之间" }));
  }
  return errors;
}

/** 新建灯具的推荐起始地址：紧接现有最大结束通道之后 */
export function suggestNextDmxAddress(fixtures: Fixture[], mode: ChannelMode): number {
  const need = CHANNEL_MODE_OCCUPANCY[mode];
  const occupied = fixtures
    .map(channelRange)
    .sort((a, b) => a[0] - b[0]);
  let cursor = 1;
  for (const [start, end] of occupied) {
    if (cursor + need - 1 < start) return cursor;
    cursor = Math.max(cursor, end + 1);
  }
  return cursor + need - 1 <= DMX_UNIVERSE_SIZE ? cursor : 1;
}

/** 保存（创建/更新）灯具；存在 DMX 冲突时抛业务异常，由 api 层与页面接住 */
export function assertFixtureSavable(fixture: Fixture, fixtures: Fixture[]): void {
  const errors = validateFixture(fixture, fixtures);
  if (errors.length > 0) {
    const conflict = findDmxConflict(fixture, fixtures);
    if (conflict) {
      logAction("Fixture", "conflict", {
        code: fixture.fixture_code,
        address: fixture.dmx_address,
        other: conflict.fixture_code
      });
    }
    throw new BusinessError(
      conflict ? ERROR_CODES.DMX_ADDRESS_CONFLICT : ERROR_CODES.VALIDATION_FAILED,
      errors[0],
      conflict
        ? {
            address: fixture.dmx_address,
            code: conflict.fixture_code,
            range: formatDmxRange(conflict.dmx_address, conflict.channel_count)
          }
        : { field: "灯具表单" }
    );
  }
}

export function buildFixtureDraft(mode: ChannelMode, fixtures: Fixture[]) {
  return createDefaultFixture({
    color_mode: mode,
    channel_count: CHANNEL_MODE_OCCUPANCY[mode],
    dmx_address: suggestNextDmxAddress(fixtures, mode)
  });
}

/** 记录创建/更新/删除日志（service 写操作必备） */
export function logFixtureCreated(fixture: Fixture): void {
  logAction("Fixture", "create", {
    code: fixture.fixture_code,
    type: fixture.fixture_type,
    address: fixture.dmx_address
  });
}

export function logFixtureUpdated(before: Fixture, after: Fixture): void {
  const fields = Object.keys(after).filter((key) => key !== "id" && (before as never as Record<string, unknown>)[key] !== (after as never as Record<string, unknown>)[key]).join(",");
  logAction("Fixture", "update", { code: after.fixture_code, fields: fields || "无" });
}

export function logFixtureRemoved(fixture: Fixture): void {
  logAction("Fixture", "remove", {
    code: fixture.fixture_code,
    range: formatDmxRange(fixture.dmx_address, fixture.channel_count)
  });
}
