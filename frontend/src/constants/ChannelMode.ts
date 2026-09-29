import type { ChannelMode } from "../types/ChannelMode";

/** ChannelMode 常量侧定义，新增模式需同步通道表 channelProfiles、校验与滑杆组件 */
export const CHANNEL_MODES: readonly ChannelMode[] = ["RGB", "RGBW", "DIMMER_ONLY", "MOVING_HEAD"];

export const CHANNEL_MODE_TEXT: Record<ChannelMode, string> = {
  RGB: "RGB 三通道",
  RGBW: "RGBW 四通道",
  DIMMER_ONLY: "仅调光",
  MOVING_HEAD: "摇头灯（带水平/垂直）"
};

/** 每种通道模式占用的 DMX 通道数，灯具布置页校验通道冲突时读取 */
export const CHANNEL_MODE_OCCUPANCY: Record<ChannelMode, number> = {
  RGB: 3,
  RGBW: 4,
  DIMMER_ONLY: 1,
  MOVING_HEAD: 7 // R/G/B + dimmer + pan + tilt + speed
};
