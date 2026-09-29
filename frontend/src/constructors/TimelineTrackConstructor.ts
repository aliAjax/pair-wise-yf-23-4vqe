import type { TimelineTrack } from "../types/TimelineTrack";
import { TIMELINE_MIN_DURATION_MS } from "../constants/playback";
import { createId } from "../utils/id";

export interface TimelineTrackDraft {
  cue_scene_id: string;
  start_ms: number;
  duration_ms: number;
  layer: number;
  locked: boolean;
}

/** 新建片段表单默认对象：从 0 时刻起、5 秒长、放在第 1 层 */
export function createTimelineTrackForm(overrides: Partial<TimelineTrackDraft> = {}): TimelineTrackDraft {
  return {
    cue_scene_id: "",
    start_ms: 0,
    duration_ms: 5000,
    layer: 1,
    locked: false,
    ...overrides
  };
}

export function createTimelineTrackFromDraft(draft: TimelineTrackDraft, id?: string): TimelineTrack {
  return { id: id ?? createId("trk"), ...draft };
}

export function createTimelineTrackFromImport(raw: Partial<TimelineTrack>): TimelineTrack {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createId("trk"),
    cue_scene_id: String(raw.cue_scene_id ?? ""),
    start_ms: Number(raw.start_ms ?? 0),
    duration_ms: Number(raw.duration_ms ?? TIMELINE_MIN_DURATION_MS),
    layer: Number(raw.layer ?? 1),
    locked: Boolean(raw.locked)
  };
}

export const createDefaultTimelineTrack = createTimelineTrackFromDraft;
export const createTimelineTrackResponse = createTimelineTrackFromDraft;
