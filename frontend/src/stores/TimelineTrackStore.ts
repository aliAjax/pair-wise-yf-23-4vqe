import { create } from "zustand";
import type { TimelineTrack, TimelineMeta } from "../types/TimelineTrack";
import { useRepository } from "./repository";
import * as TrackApi from "../api/TimelineTrack";

interface TimelineTrackStoreState {
  rows: TimelineTrack[];
  meta: TimelineMeta;
  loading: boolean;
  load: () => Promise<void>;
  place: (payload: Partial<TimelineTrack> & { cue_scene_id: number }) => Promise<TimelineTrack>;
  update: (id: number, patch: Partial<TimelineTrack>) => Promise<TimelineTrack>;
  remove: (id: number) => Promise<void>;
  setLayerLocked: (layer: number, locked: boolean) => Promise<void>;
}

export const useTimelineTrackStore = create<TimelineTrackStoreState>((set) => ({
  rows: useRepository.getState().tracks,
  meta: useRepository.getState().timeline_meta,
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await TrackApi.listTimelineTrack(), loading: false });
  },
  place: async (payload) => {
    const created = await TrackApi.placeTimelineTrack(payload);
    set({ rows: useRepository.getState().tracks });
    return created;
  },
  update: async (id, patch) => {
    const updated = await TrackApi.updateTimelineTrack(id, patch);
    set({ rows: useRepository.getState().tracks });
    return updated;
  },
  remove: async (id) => {
    await TrackApi.deleteTimelineTrack(id);
    set({ rows: useRepository.getState().tracks });
  },
  setLayerLocked: async (layer, locked) => {
    await TrackApi.setLayerLocked(layer, locked);
    set({ rows: useRepository.getState().tracks, meta: useRepository.getState().timeline_meta });
  }
}));

useRepository.subscribe((state) => {
  useTimelineTrackStore.setState({ rows: state.tracks, meta: state.timeline_meta });
});
