import type { ShowProject } from "../types/ShowProject";
import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { TimelineMeta } from "../types/TimelineTrack";

/** 本地保存的完整演出快照（方案 + 灯具 + 场景 + 轨道 + 图层锁定） */
export interface ShowSnapshot {
  version: number;
  project: ShowProject;
  fixtures: Fixture[];
  cues: CueScene[];
  tracks: TimelineTrack[];
  timeline_meta: TimelineMeta;
  saved_at: string;
}
