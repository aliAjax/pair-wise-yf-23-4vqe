import { create } from "zustand";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { TimelineTrackDraft } from "../constructors/TimelineTrackConstructor";
import type { CueScene } from "../types/CueScene";
import * as trackService from "../services/TimelineTrackService";
import { ControllerError } from "../utils/errors";

interface TimelineTrackStoreState {
  rows: TimelineTrack[];
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  create: (draft: TimelineTrackDraft, scene: CueScene | undefined) => Promise<TimelineTrack>;
  update: (track: TimelineTrack, scene: CueScene | undefined) => Promise<TimelineTrack>;
  setLocked: (track: TimelineTrack, locked: boolean) => Promise<void>;
  remove: (track: TimelineTrack) => Promise<void>;
  removeByCue: (cueId: string) => Promise<void>;
  replaceAll: (rows: TimelineTrack[]) => Promise<void>;
}

export const useTimelineTrackStore = create<TimelineTrackStoreState>((set, get) => ({
  rows: [],
  loading: false,
  loaded: false,

  async load() {
    set({ loading: true });
    try {
      set({ rows: await trackService.listTracks(), loading: false, loaded: true });
    } catch (error) {
      set({ loading: false });
      throw new ControllerError(error as Error, "时间轴数据加载失败");
    }
  },

  async create(draft, scene) {
    try {
      const track = await trackService.createTrack(draft, get().rows, scene);
      set({ rows: [...get().rows, track] });
      return track;
    } catch (error) {
      throw new ControllerError(error as Error, "片段添加失败");
    }
  },

  async update(track, scene) {
    try {
      const saved = await trackService.updateTrack(track, get().rows, scene);
      set({ rows: get().rows.map((row) => (row.id === saved.id ? saved : row)) });
      return saved;
    } catch (error) {
      throw new ControllerError(error as Error, "片段移动失败");
    }
  },

  async setLocked(track, locked) {
    const saved = await trackService.setTrackLocked(track, locked);
    set({ rows: get().rows.map((row) => (row.id === saved.id ? saved : row)) });
  },

  async remove(track) {
    try {
      await trackService.removeTrack(track);
      set({ rows: get().rows.filter((row) => row.id !== track.id) });
    } catch (error) {
      throw new ControllerError(error as Error, "片段删除失败");
    }
  },

  /** 删除场景时级联删除其全部片段 */
  async removeByCue(cueId) {
    const targets = get().rows.filter((row) => row.cue_scene_id === cueId);
    await Promise.all(targets.map((track) => trackService.removeTrack(track)));
    set({ rows: get().rows.filter((row) => row.cue_scene_id !== cueId) });
  },

  async replaceAll(rows) {
    await trackService.replaceAllTracks(rows);
    set({ rows });
  }
}));
