import type { CueSceneId } from "./CueScene";

export type TimelineTrackId = string;

export interface TimelineTrack {
  id: TimelineTrackId;
  cue_scene_id: CueSceneId;
  /** 片段起始时刻（毫秒） */
  start_ms: number;
  /** 片段时长（毫秒） */
  duration_ms: number;
  /** 轨道层，同层片段不允许重叠 */
  layer: number;
  locked: boolean;
}
