import type { Fixture, FixtureId } from "../types/Fixture";
import type { FixtureType } from "../types/FixtureType";
import type { ChannelMode } from "../types/ChannelMode";
import { ChannelModeChannels } from "../constants/ChannelMode";
import { createId } from "../utils/id";

export interface FixtureDraft {
  fixture_code: string;
  fixture_type: FixtureType;
  position_x: number;
  position_y: number;
  dmx_address: number;
  color_mode: ChannelMode;
  channel_count?: number;
}

/** 新建灯具表单的默认对象（页面/store 不允许散写默认结构） */
export function createFixtureForm(overrides: Partial<FixtureDraft> = {}): FixtureDraft {
  return {
    fixture_code: "",
    fixture_type: "PAR",
    position_x: 50,
    position_y: 50,
    dmx_address: 1,
    color_mode: "RGB",
    ...overrides
  };
}

/** 落库对象：通道数默认按通道模式推导，可手动覆盖 */
export function createFixtureFromDraft(draft: FixtureDraft, id?: FixtureId): Fixture {
  return {
    id: id ?? createId("fx"),
    fixture_code: draft.fixture_code,
    fixture_type: draft.fixture_type,
    position_x: draft.position_x,
    position_y: draft.position_y,
    dmx_address: draft.dmx_address,
    channel_count: draft.channel_count ?? ChannelModeChannels[draft.color_mode],
    color_mode: draft.color_mode
  };
}

/** 导入数据的兜底构造器，字段缺失时补默认值 */
export function createFixtureFromImport(raw: Partial<Fixture>): Fixture {
  const colorMode: ChannelMode = raw.color_mode ?? "RGB";
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createId("fx"),
    fixture_code: raw.fixture_code ?? "未命名灯具",
    fixture_type: raw.fixture_type ?? "PAR",
    position_x: Number(raw.position_x ?? 50),
    position_y: Number(raw.position_y ?? 50),
    dmx_address: Number(raw.dmx_address ?? 1),
    channel_count: Number(raw.channel_count ?? ChannelModeChannels[colorMode]),
    color_mode: colorMode
  };
}

export const createDefaultFixture = createFixtureFromDraft;
export const createFixtureResponse = createFixtureFromDraft;
