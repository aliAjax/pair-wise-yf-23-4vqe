import type { CueStatus } from "./CueStatus";
import type { FixtureState } from "./Fixture";

/**
 * 灯光场景 CueScene —— 一组灯具的颜色/亮度快照 + 淡入/保持时间 + 优先级。
 * 优先级数值越大，时间轴上同时刻叠加时覆盖能力越强。
 */
export interface CueScene {
  id: number;
  name: string;
  fixture_states: FixtureState[];
  fade_in_ms: number;
  hold_ms: number;
  priority: number;
  scene_status: CueStatus;
}
