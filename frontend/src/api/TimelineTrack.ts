import type { TimelineTrack } from "../types/TimelineTrack";
import type { TimelineMeta } from "../types/TimelineTrack";
import { useRepository } from "../stores/repository";
import { withLocalApi, delay } from "./localClient";
import {
  assertLayerWritable,
  assertTrackPlaceable,
  logTrackCreated,
  logTrackRemoved,
  logTrackUpdated
} from "../services/TimelineService";
import { findCue } from "../services/CueSceneService";
import { nextId } from "../utils/id";
import { createDefaultTimelineTrack } from "../constructors/TimelineTrackConstructor";

export async function listTimelineTrack(): Promise<TimelineTrack[]> {
  return withLocalApi(async () => {
    await delay();
    return useRepository.getState().tracks.map((row) => ({ ...row }));
  });
}

/**
 * 排场景到时间轴：同图层区间重叠会被挡住（抛 TIMELINE_OVERLAP），
 * 图层锁定抛 TRACK_LOCKED。
 */
export async function placeTimelineTrack(payload: Partial<TimelineTrack> & { cue_scene_id: number }): Promise<TimelineTrack> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    const cue = findCue(repo.cues, payload.cue_scene_id);
    const candidate = createDefaultTimelineTrack({ ...payload, id: payload.id ?? 0 });
    assertTrackPlaceable(candidate, repo.tracks, repo.timeline_meta, cue.name);
    const existing = payload.id ? repo.tracks.find((row) => row.id === payload.id) : undefined;
    if (existing) {
      assertTrackPlaceable(candidate, repo.tracks, repo.timeline_meta, cue.name);
      logTrackUpdated(existing, candidate, cue.name);
      repo.patch({ tracks: repo.tracks.map((row) => (row.id === candidate.id ? candidate : row)) });
      return candidate;
    }
    const created: TimelineTrack = { ...candidate, id: nextId(repo.tracks) };
    logTrackCreated(created, cue.name);
    repo.patch({
      tracks: [...repo.tracks, created],
      project: { ...repo.project, track_ids: [...repo.project.track_ids, created.id], updated_at: new Date().toISOString() }
    });
    return created;
  });
}

export async function updateTimelineTrack(id: number, patch: Partial<TimelineTrack>): Promise<TimelineTrack> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    const existing = repo.tracks.find((row) => row.id === id);
    if (!existing) return existing as never;
    const cue = findCue(repo.cues, existing.cue_scene_id);
    const candidate: TimelineTrack = { ...existing, ...patch, id };
    assertTrackPlaceable(candidate, repo.tracks, repo.timeline_meta, cue.name);
    logTrackUpdated(existing, candidate, cue.name);
    repo.patch({ tracks: repo.tracks.map((row) => (row.id === id ? candidate : row)) });
    return candidate;
  });
}

export async function deleteTimelineTrack(id: number): Promise<void> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    const track = repo.tracks.find((row) => row.id === id);
    if (!track) return;
    assertLayerWritable(track.layer, repo.timeline_meta);
    const cue = repo.cues.find((item) => item.id === track.cue_scene_id);
    logTrackRemoved(track, cue?.name ?? `#${track.cue_scene_id}`);
    repo.patch({ tracks: repo.tracks.filter((row) => row.id !== id) });
  });
}

/** 锁定 / 解锁整条图层轨道 */
export async function setLayerLocked(layer: number, locked: boolean): Promise<void> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    const meta: TimelineMeta = {
      ...repo.timeline_meta,
      locks: { ...repo.timeline_meta.locks, [layer]: locked }
    };
    // 单块 locked 与图层锁保持一致
    const tracks = repo.tracks.map((track) =>
      track.layer === layer ? { ...track, locked } : track
    );
    repo.patch({ timeline_meta: meta, tracks });
  });
}
