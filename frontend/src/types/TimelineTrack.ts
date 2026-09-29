/**
 * 时间轴轨道块 TimelineTrack —— 一个场景在时间轴某一图层（layer）上的排期。
 * 同一 layer 上 [start_ms, start_ms+duration_ms) 区间不允许重叠，重叠会被挡住。
 * locked 的图层上不允许新建/移动/删除轨道块。
 */
export interface TimelineTrack {
  id: number;
  cue_scene_id: number;
  start_ms: number;
  duration_ms: number;
  layer: number;
  locked: boolean;
}

/** 图层维度的锁定状态（按 layer 序号），与单块 locked 冗余保存，便于锁定整条轨道 */
export interface TimelineLockMap {
  [layer: number]: boolean;
}

export interface TimelineMeta {
  layer_count: number;
  locks: TimelineLockMap;
}
