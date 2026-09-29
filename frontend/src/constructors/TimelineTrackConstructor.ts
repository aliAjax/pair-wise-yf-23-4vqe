import type { TimelineTrack } from "../types/TimelineTrack";
import { TIMELINE_CONSTANTS } from "../constants/appConfig";

/** 默认轨道块：由调用方传入场景与起始时间 */
export function createDefaultTimelineTrack(overrides: Partial<TimelineTrack> = {}): TimelineTrack {
  return {
    id: 0,
    cue_scene_id: 0,
    start_ms: 0,
    duration_ms: TIMELINE_CONSTANTS.DEFAULT_TRACK_DURATION_MS,
    layer: 1,
    locked: false,
    ...overrides
  };
}

export function createTimelineTrackResponse(raw: Partial<TimelineTrack>): TimelineTrack {
  return createDefaultTimelineTrack({
    ...raw,
    id: Number(raw.id) || 0,
    cue_scene_id: Number(raw.cue_scene_id) || 0,
    start_ms: Number(raw.start_ms) || 0,
    duration_ms: Number(raw.duration_ms) || TIMELINE_CONSTANTS.DEFAULT_TRACK_DURATION_MS,
    layer: Number(raw.layer) || 1,
    locked: Boolean(raw.locked)
  });
}
