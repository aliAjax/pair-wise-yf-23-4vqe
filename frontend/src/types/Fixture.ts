import type { FixtureType } from "./FixtureType";
import type { ChannelMode } from "./ChannelMode";

/**
 * 灯具 Fixture —— 舞台平面图上的一台灯具。
 * position_x / position_y 为舞台百分比坐标（0-100）。
 * dmx_address 为起始 DMX 地址（1-512），channel_count 决定占用通道数。
 */
export interface Fixture {
  id: number;
  fixture_code: string;
  fixture_type: FixtureType;
  position_x: number;
  position_y: number;
  dmx_address: number;
  channel_count: number;
  color_mode: ChannelMode;
}

/** 场景内单台灯具的状态：颜色、亮度，以及摇头灯的目标舞台坐标 */
export interface FixtureState {
  fixture_id: number;
  color: string;
  brightness: number; // 0-100
  target_x?: number; // 0-100，仅 MOVING_HEAD 使用
  target_y?: number; // 0-100，仅 MOVING_HEAD 使用
}

export const FIXTURE_CODE_PATTERN = /^[A-Za-z0-9-_]{1,24}$/;
export const DMX_UNIVERSE_SIZE = 512;
