import type { TimelineTrack } from "../types/TimelineTrack";
import type { TimelineMeta } from "../types/TimelineTrack";
import type { CueScene } from "../types/CueScene";
import { ERROR_CODES } from "../constants/errorCodes";
import { formatErrorMessage } from "../constants/errorMessages";
import { BusinessError } from "./BusinessError";
import { logAction } from "./logger";
import { TIMELINE_CONSTANTS } from "../constants/appConfig";

export function trackEnd(track: TimelineTrack): number {
  return track.start_ms + track.duration_ms;
}

/** 同图层半开区间重叠判断（首尾相接不算重叠） */
export function tracksOverlap(a: TimelineTrack, b: TimelineTrack): boolean {
  return a.layer === b.layer && a.start_ms < trackEnd(b) && b.start_ms < trackEnd(a);
}

/** 返回挡住当前轨道块的同图层已排块（排除自身） */
export function findOverlap(track: TimelineTrack, tracks: TimelineTrack[]): TimelineTrack | null {
  return tracks.find((other) => other.id !== track.id && tracksOverlap(track, other)) ?? null;
}

export function isLayerLocked(meta: TimelineMeta, layer: number): boolean {
  return Boolean(meta.locks[layer]);
}

export function assertTrackPlaceable(
  track: TimelineTrack,
  tracks: TimelineTrack[],
  meta: TimelineMeta,
  cueName: string
): void {
  if (isLayerLocked(meta, track.layer)) {
    throw new BusinessError(
      ERROR_CODES.TRACK_LOCKED,
      formatErrorMessage(ERROR_CODES.TRACK_LOCKED, { layer: track.layer }),
      { layer: track.layer }
    );
  }
  const overlap = findOverlap(track, tracks);
  if (overlap) {
    logAction("TimelineTrack", "overlap", { layer: track.layer, start: track.start_ms, cue: cueName });
    throw new BusinessError(
      ERROR_CODES.TIMELINE_OVERLAP,
      formatErrorMessage(ERROR_CODES.TIMELINE_OVERLAP, {
        layer: track.layer,
        start: track.start_ms,
        end: trackEnd(track),
        cue: cueName
      }),
      { layer: track.layer, start: track.start_ms }
    );
  }
}

export function assertLayerWritable(layer: number, meta: TimelineMeta): void {
  if (isLayerLocked(meta, layer)) {
    throw new BusinessError(
      ERROR_CODES.TRACK_LOCKED,
      formatErrorMessage(ERROR_CODES.TRACK_LOCKED, { layer }),
      { layer }
    );
  }
}

/** 拖拽对齐网格 */
export function snapToGrid(ms: number): number {
  const grid = TIMELINE_CONSTANTS.SNAP_GRID_MS;
  return Math.max(0, Math.round(ms / grid) * grid);
}

export function findTrack(tracks: TimelineTrack[], id: number): TimelineTrack {
  const track = tracks.find((item) => item.id === id);
  if (!track) {
    throw new BusinessError(
      ERROR_CODES.TRACK_NOT_FOUND,
      formatErrorMessage(ERROR_CODES.TRACK_NOT_FOUND, { id }),
      { id }
    );
  }
  return track;
}

export function logTrackCreated(track: TimelineTrack, cueName: string): void {
  logAction("TimelineTrack", "create", { cue: cueName, layer: track.layer, start: track.start_ms });
}

export function logTrackUpdated(before: TimelineTrack, after: TimelineTrack, cueName: string): void {
  const fields = Object.keys(after).filter((key) => key !== "id" && (before as never as Record<string, unknown>)[key] !== (after as never as Record<string, unknown>)[key]).join(",");
  logAction("TimelineTrack", "update", { id: after.id, cue: cueName, fields: fields || "无" });
}

export function logTrackRemoved(track: TimelineTrack, cueName: string): void {
  logAction("TimelineTrack", "remove", { id: track.id, cue: cueName });
}

export function logOverlapBlocked(track: TimelineTrack, blocker: TimelineTrack, cues: CueScene[]): void {
  const cueName = cues.find((cue) => cue.id === blocker.cue_scene_id)?.name ?? `#${blocker.cue_scene_id}`;
  logAction("TimelineTrack", "overlap", { layer: track.layer, start: track.start_ms, cue: cueName });
}
