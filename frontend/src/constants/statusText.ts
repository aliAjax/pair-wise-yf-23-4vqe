import { FIXTURE_TYPE_TEXT } from "./FixtureType";
import { CUE_STATUS_TEXT } from "./CueStatus";
import { CHANNEL_MODE_TEXT } from "./ChannelMode";
import type { FixtureType } from "../types/FixtureType";
import type { CueStatus } from "../types/CueStatus";
import type { ChannelMode } from "../types/ChannelMode";

/** 状态/枚举文案的统一出口，formatters 与展示组件都从这里取中文文案 */
export const STATUS_TEXT = {
  FixtureType: FIXTURE_TYPE_TEXT as Record<FixtureType, string>,
  CueStatus: CUE_STATUS_TEXT as Record<CueStatus, string>,
  ChannelMode: CHANNEL_MODE_TEXT as Record<ChannelMode, string>
};
