import type { FixtureId } from "./Fixture";

/**
 * 场景内单台灯具的目标状态。
 * r/g/b/w/dimmer 均为 0-255；target_x/target_y 为摇头灯目标坐标 0-100。
 */
export interface FixtureState {
  r: number;
  g: number;
  b: number;
  w: number;
  dimmer: number;
  target_x: number;
  target_y: number;
}

export type FixtureStateMap = Record<FixtureId, FixtureState>;

export function createEmptyFixtureState(): FixtureState {
  return { r: 0, g: 0, b: 0, w: 0, dimmer: 0, target_x: 50, target_y: 50 };
}
