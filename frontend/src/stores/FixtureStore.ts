import { create } from "zustand";
import type { Fixture } from "../types/Fixture";
import type { FixtureDraft } from "../constructors/FixtureConstructor";
import * as fixtureService from "../services/FixtureService";
import { ControllerError } from "../utils/errors";

interface FixtureState2 {
  rows: Fixture[];
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  create: (draft: FixtureDraft) => Promise<Fixture>;
  update: (fixture: Fixture) => Promise<Fixture>;
  remove: (fixture: Fixture) => Promise<void>;
  replaceAll: (rows: Fixture[]) => Promise<void>;
}

export const useFixtureStore = create<FixtureState2>((set, get) => ({
  rows: [],
  loading: false,
  loaded: false,

  async load() {
    set({ loading: true });
    try {
      const rows = await fixtureService.listFixtures();
      set({ rows, loading: false, loaded: true });
    } catch (error) {
      set({ loading: false });
      throw new ControllerError(error as Error, "灯具数据加载失败");
    }
  },

  async create(draft) {
    try {
      const fixture = await fixtureService.createFixture(draft, get().rows);
      set({ rows: [...get().rows, fixture] });
      return fixture;
    } catch (error) {
      throw new ControllerError(error as Error, "灯具创建失败");
    }
  },

  async update(fixture) {
    try {
      const saved = await fixtureService.updateFixture(fixture, get().rows);
      set({ rows: get().rows.map((row) => (row.id === saved.id ? saved : row)) });
      return saved;
    } catch (error) {
      throw new ControllerError(error as Error, "灯具更新失败");
    }
  },

  async remove(fixture) {
    try {
      await fixtureService.removeFixture(fixture);
      set({ rows: get().rows.filter((row) => row.id !== fixture.id) });
    } catch (error) {
      throw new ControllerError(error as Error, "灯具删除失败");
    }
  },

  async replaceAll(rows) {
    await fixtureService.replaceAllFixtures(rows);
    set({ rows });
  }
}));
