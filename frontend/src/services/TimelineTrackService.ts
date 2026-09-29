import type { TimelineTrack } from "../types/TimelineTrack";
import type { CueScene } from "../types/CueScene";
import * as trackApi from "../api/TimelineTrack";
import { createTimelineTrackFromDraft, type TimelineTrackDraft } from "../constructors/TimelineTrackConstructor";
import { assertLayerAvailable, assertLayerUnlocked, isLayerLocked } from "../utils/timeline";
import { TIMELINE_MIN_DURATION_MS } from "../constants/playback";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "../utils/errors";
import { writeLog } from "../utils/logger";

function requireSceneName(scene: CueScene | undefined): string {
  if (!scene) throw new ServiceError(ERROR_CODES.CUE_NOT_FOUND, { name: "（已删除的场景）" });
  return scene.name;
}

export async function listTracks(): Promise<TimelineTrack[]> {
  return trackApi.listTimelineTrack();
}

/** 新增片段：同层重叠挡住、锁层挡住 */
export async function createTrack(
  draft: TimelineTrackDraft,
  tracks: TimelineTrack[],
  scene: CueScene | undefined
): Promise<TimelineTrack> {
  const name = requireSceneName(scene);
  if (draft.duration_ms < TIMELINE_MIN_DURATION_MS) {
    throw new ServiceError(ERROR_CODES.VALIDATION_FAILED, { field: `片段时长至少 ${TIMELINE_MIN_DURATION_MS}ms` });
  }
  assertLayerUnlocked(draft.layer, tracks, name);
  const track = createTimelineTrackFromDraft(draft);
  assertLayerAvailable(track, tracks, name);
  await trackApi.saveTimelineTrack(track);
  await writeLog("TimelineTrack", "CREATE", { name: `${name} @L${draft.layer}` });
  return track;
}

/** 拖拽移动 / 改时长：锁层与重叠都会抛异常 */
export async function updateTrack(
  track: TimelineTrack,
  tracks: TimelineTrack[],
  scene: CueScene | undefined
): Promise<TimelineTrack> {
  const name = requireSceneName(scene);
  assertLayerUnlocked(track.layer, tracks.filter((item) => item.id !== track.id), name);
  assertLayerAvailable(track, tracks, name);
  await trackApi.saveTimelineTrack(track);
  await writeLog("TimelineTrack", "UPDATE", { name: `${name} @L${track.layer}` });
  return track;
}

export async function setTrackLocked(track: TimelineTrack, locked: boolean): Promise<TimelineTrack> {
  const next = { ...track, locked };
  await trackApi.saveTimelineTrack(next);
  await writeLog("TimelineTrack", "STATUS", {
    name: `片段 ${track.id.slice(-4)} @L${track.layer}`,
    detail: locked ? "锁定" : "解锁"
  });
  return next;
}

export async function removeTrack(track: TimelineTrack): Promise<void> {
  await trackApi.deleteTimelineTrack(track.id);
  await writeLog("TimelineTrack", "DELETE", { name: `片段 ${track.id.slice(-4)} @L${track.layer}` });
}

export async function replaceAllTracks(rows: TimelineTrack[]): Promise<void> {
  await trackApi.saveTimelineTrackMany(rows);
}

export { isLayerLocked };
