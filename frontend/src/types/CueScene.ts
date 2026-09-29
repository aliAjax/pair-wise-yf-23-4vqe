import type { FixtureStateMap } from "./FixtureState";
import type { CueStatus } from "./CueStatus";

export type CueSceneId = string;

export interface CueScene {
  id: CueSceneId;
  name: string;
  fixture_states: FixtureStateMap;
  /** 淡入时间（毫秒） */
  fade_in_ms: number;
  /** 保持时间（毫秒），0 表示跟随时间轴片段长度 */
  hold_ms: number;
  /** 优先级，数值越大优先级越高 */
  priority: number;
  scene_status: CueStatus;
}
