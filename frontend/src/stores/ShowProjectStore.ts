import { create } from "zustand";
import type { ShowProject } from "../types/ShowProject";
import type { ShowSnapshot } from "../types/ShowSnapshot";
import { useRepository } from "./repository";
import * as ProjectApi from "../api/ShowProject";

interface ShowProjectStoreState {
  current: ShowProject;
  load: () => Promise<void>;
  update: (patch: Partial<ShowProject>) => Promise<ShowProject>;
  exportJson: () => Promise<string>;
  importJson: (raw: string) => Promise<ShowSnapshot>;
}

export const useShowProjectStore = create<ShowProjectStoreState>((set) => ({
  current: useRepository.getState().project,
  async load() {
    set({ current: (await ProjectApi.listShowProject())[0] });
  },
  update: async (patch) => {
    const updated = await ProjectApi.updateShowProject(patch);
    set({ current: updated });
    return updated;
  },
  exportJson: () => ProjectApi.exportShowProject(),
  importJson: async (raw) => {
    const snapshot = await ProjectApi.importShowProject(raw);
    set({ current: snapshot.project });
    return snapshot;
  }
}));

useRepository.subscribe((state) => {
  useShowProjectStore.setState({ current: state.project });
});
