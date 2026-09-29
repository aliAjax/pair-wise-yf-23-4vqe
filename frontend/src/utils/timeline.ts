import type { TimelineTrack } from "../types/TimelineTrack";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "./errors";

export interface TimeRange {
  begin: number;
  end: number;
}

export function trackRangeOf(track: Pick<TimelineTrack, "start_ms" | "duration_ms">): TimeRange {
  return { begin: track.start_ms, end: track.start_ms + track.duration_ms };
}

export function timeOverlaps(a: TimeRange, b: TimeRange): boolean {
  return a.begin < b.end && b.begin < a.end;
}

/**
 * 同轨（同 layer）重叠即挡住：返回同层第一个与之重叠的其他片段。
 * 片段首尾相接不算重叠。
 */
export function findLayerOverlap(
  candidate: Pick<TimelineTrack, "id" | "start_ms" | "duration_ms" | "layer">,
  tracks: TimelineTrack[]
): TimelineTrack | null {
  const target = trackRangeOf(candidate);
  return (
    tracks.find(
      (track) =>
        track.id !== candidate.id &&
        track.layer === candidate.layer &&
        timeOverlaps(target, trackRangeOf(track))
    ) ?? null
  );
}

export function assertLayerAvailable(
  candidate: Pick<TimelineTrack, "id" | "start_ms" | "duration_ms" | "layer">,
  tracks: TimelineTrack[],
  sceneName: string
): void {
  const overlap = findLayerOverlap(candidate, tracks);
  if (overlap) {
    const range = trackRangeOf(overlap);
    throw new ServiceError(ERROR_CODES.TRACK_OVERLAP, {
      layer: candidate.layer,
      name: sceneName,
      begin: range.begin,
      end: range.end
    });
  }
}

/** 该层是否处于锁定状态（层上任意片段 locked 即视为锁层） */
export function isLayerLocked(layer: number, tracks: TimelineTrack[]): boolean {
  return tracks.some((track) => track.layer === layer && track.locked);
}

export function assertLayerUnlocked(layer: number, tracks: TimelineTrack[], sceneName: string): void {
  if (isLayerLocked(layer, tracks)) {
    throw new ServiceError(ERROR_CODES.TRACK_LAYER_LOCKED, { layer, name: sceneName });
  }
}

/** 吸附到 TIMELINE_STEP_MS 网格 */
export function snapTime(value: number, step: number): number {
  return Math.max(0, Math.round(value / step) * step);
}
