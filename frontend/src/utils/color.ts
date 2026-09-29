import type { FixtureState } from "../types/FixtureState";

export function clamp255(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function channelToHex(value: number): string {
  return clamp255(value).toString(16).padStart(2, "0");
}

/** 灯具状态 -> CSS 颜色（RGBW 模式下白光按比例提亮并降低饱和） */
export function stateToColor(state: FixtureState): string {
  const wMix = clamp01(state.w / 255);
  const r = state.r + (255 - state.r) * wMix * 0.85;
  const g = state.g + (255 - state.g) * wMix * 0.85;
  const b = state.b + (255 - state.b) * wMix * 0.85;
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

/** 0-255 的 RGB -> #rrggbb，供颜色选择器 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const matched = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!matched) return { r: 0, g: 0, b: 0 };
  const value = parseInt(matched[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/** 线性插值两台灯具状态（淡入时颜色与位置一起渐变） */
export function lerpState(from: FixtureState, to: FixtureState, progress: number): FixtureState {
  const t = clamp01(progress);
  return {
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
    w: from.w + (to.w - from.w) * t,
    dimmer: from.dimmer + (to.dimmer - from.dimmer) * t,
    target_x: from.target_x + (to.target_x - from.target_x) * t,
    target_y: from.target_y + (to.target_y - from.target_y) * t
  };
}
