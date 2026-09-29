import type { FixtureType } from "./FixtureType";
import type { ChannelMode } from "./ChannelMode";

export type FixtureId = string;

export interface Fixture {
  id: FixtureId;
  fixture_code: string;
  fixture_type: FixtureType;
  /** 舞台平面坐标，0-100（百分比） */
  position_x: number;
  position_y: number;
  /** DMX 起始地址，1-512 */
  dmx_address: number;
  /** 占用通道数 */
  channel_count: number;
  color_mode: ChannelMode;
}
