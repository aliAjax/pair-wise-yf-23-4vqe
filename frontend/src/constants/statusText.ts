import { FixtureTypeText } from "./FixtureType";
import { CueStatusText, CueStatusTone } from "./CueStatus";
import { ChannelModeText } from "./ChannelMode";

/** 状态/枚举文案的聚合出口，页面、筛选器与徽标统一从这里取 */
export const STATUS_TEXT = {
  FixtureType: FixtureTypeText,
  CueStatus: CueStatusText,
  CueStatusTone,
  ChannelMode: ChannelModeText
};
