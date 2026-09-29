import { create } from "zustand";
import type { CueScene } from "../types/CueScene";
import type { CueStatus } from "../types/CueStatus";
import { useRepository } from "./repository";
import * as CueApi from "../api/CueScene";

interface CueSceneStoreState {
  rows: CueScene[];
  loading: boolean;
  filterStatus: CueStatus | "ALL";
  setFilterStatus: (status: CueStatus | "ALL") => void;
  load: () => Promise<void>;
  save: (cue: CueScene) => Promise<CueScene>;
  remove: (id: number) => Promise<void>;
  setStatus: (id: number, status: CueStatus) => Promise<void>;
}

export const useCueSceneStore = create<CueSceneStoreState>((set) => ({
  rows: useRepository.getState().cues,
  loading: false,
  filterStatus: "ALL",
  setFilterStatus: (status) => set({ filterStatus: status }),
  async load() {
    set({ loading: true });
    set({ rows: await CueApi.listCueScene(), loading: false });
  },
  save: async (cue) => {
    const saved = await CueApi.saveCueScene(cue);
    set({ rows: useRepository.getState().cues });
    return saved;
  },
  remove: async (id) => {
    await CueApi.deleteCueScene(id);
    set({ rows: useRepository.getState().cues });
  },
  setStatus: async (id, status) => {
    await CueApi.updateCueStatus(id, status);
    set({ rows: useRepository.getState().cues });
  }
}));

useRepository.subscribe((state) => {
  useCueSceneStore.setState({ rows: state.cues });
});
