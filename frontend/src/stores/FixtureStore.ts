import { create } from "zustand";
import type { Fixture } from "../types/Fixture";
import type { ChannelMode } from "../types/ChannelMode";
import { useRepository } from "./repository";
import * as FixtureApi from "../api/Fixture";

interface FixtureStoreState {
  rows: Fixture[];
  loading: boolean;
  load: () => Promise<void>;
  save: (fixture: Fixture) => Promise<Fixture>;
  remove: (id: number) => Promise<void>;
  newDraft: (mode: ChannelMode) => Promise<Fixture>;
}

export const useFixtureStore = create<FixtureStoreState>((set) => ({
  rows: useRepository.getState().fixtures,
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await FixtureApi.listFixture(), loading: false });
  },
  save: async (fixture) => {
    const saved = await FixtureApi.saveFixture(fixture);
    set({ rows: useRepository.getState().fixtures });
    return saved;
  },
  remove: async (id) => {
    await FixtureApi.deleteFixture(id);
    set({ rows: useRepository.getState().fixtures });
  },
  newDraft: async (mode) => FixtureApi.createFixtureDraft(mode)
}));

// 仓库（持久化层）变化时同步到实体 store
useRepository.subscribe((state) => {
  useFixtureStore.setState({ rows: state.fixtures });
});
