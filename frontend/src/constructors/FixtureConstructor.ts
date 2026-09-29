import type { Fixture, FixtureState } from "../types/Fixture";
import { CHANNEL_MODE_OCCUPANCY } from "../constants/ChannelMode";

/** 默认灯具（新建表单）：摆到舞台中央偏下，地址由调用方按空闲通道补齐 */
export function createDefaultFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 0,
    fixture_code: "",
    fixture_type: "PAR",
    position_x: 50,
    position_y: 80,
    dmx_address: 1,
    channel_count: CHANNEL_MODE_OCCUPANCY.RGB,
    color_mode: "RGB",
    ...overrides
  };
}

/** 导入数据时的响应对象构造：只保留白名单字段并兜底默认值 */
export function createFixtureResponse(raw: Partial<Fixture>): Fixture {
  return createDefaultFixture({
    ...raw,
    id: Number(raw.id) || 0,
    fixture_code: String(raw.fixture_code ?? ""),
    position_x: Number(raw.position_x) || 0,
    position_y: Number(raw.position_y) || 0,
    dmx_address: Number(raw.dmx_address) || 1,
    channel_count: Number(raw.channel_count) || 1
  });
}

/** 场景里某台灯具的默认灯态（选中灯具时使用） */
export function createDefaultFixtureState(fixtureId: number, overrides: Partial<FixtureState> = {}): FixtureState {
  return {
    fixture_id: fixtureId,
    color: "#ffffff",
    brightness: 80,
    ...overrides
  };
}
