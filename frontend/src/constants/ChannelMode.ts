import type { ChannelMode } from "../types/ChannelMode";

export const CHANNEL_MODES: readonly ChannelMode[] = ["RGB", "RGBW", "DIMMER_ONLY", "MOVING_HEAD"] as const;

export const ChannelModeText: Record<ChannelMode, string> = {
  RGB: "RGB 三色",
  RGBW: "RGBW 四色",
  DIMMER_ONLY: "仅调光",
  MOVING_HEAD: "摇头灯"
};

/** 每种通道模式占用的 DMX 通道数（摇头灯额外占 Pan/Tilt 两通道） */
export const ChannelModeChannels: Record<ChannelMode, number> = {
  RGB: 3,
  RGBW: 4,
  DIMMER_ONLY: 1,
  MOVING_HEAD: 6
};

/** 通道标签，灯具属性面板与 DMX 通道条共用 */
export const ChannelModeLabels: Record<ChannelMode, string[]> = {
  RGB: ["R", "G", "B"],
  RGBW: ["R", "G", "B", "W"],
  DIMMER_ONLY: ["DIM"],
  MOVING_HEAD: ["R", "G", "B", "DIM", "PAN", "TILT"]
};

export function supportsColor(mode: ChannelMode): boolean {
  return mode !== "DIMMER_ONLY";
}

export function supportsPanTilt(mode: ChannelMode): boolean {
  return mode === "MOVING_HEAD";
}
