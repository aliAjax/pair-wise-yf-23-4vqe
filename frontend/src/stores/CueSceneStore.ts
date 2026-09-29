import { create } from "zustand";
import type { CueScene } from "../types/CueScene";
import type { CueSceneDraft } from "../constructors/CueSceneConstructor";
import type { FixtureState } from "../types/FixtureState";
import * as cueService from "../services/CueSceneService";
import { ControllerError } from "../utils/errors";

interface CueSceneStoreState {
  rows: CueScene[];
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  create: (draft: CueSceneDraft) => Promise<CueScene>;
  update: (scene: CueScene) => Promise<CueScene>;
  setStatus: (scene: CueScene, status: CueScene["scene_status"]) => Promise<void>;
  patchFixtureState: (scene: CueScene, fixtureId: string, state: FixtureState) => Promise<void>;
  duplicate: (scene: CueScene) => Promise<CueScene>;
  remove: (scene: CueScene) => Promise<void>;
  replaceAll: (rows: CueScene[]) => Promise<void>;
}

export const useCueSceneStore = create<CueSceneStoreState>((set, get) => ({
  rows: [],
  loading: false,
  loaded: false,

  async load() {
    set({ loading: true });
    try {
      set({ rows: await cueService.listCueScenes(), loading: false, loaded: true });
    } catch (error) {
      set({ loading: false });
      throw new ControllerError(error as Error, "场景数据加载失败");
    }
  },

  async create(draft) {
    try {
      const scene = await cueService.createCueScene(draft);
      set({ rows: [...get().rows, scene] });
      return scene;
    } catch (error) {
      throw new ControllerError(error as Error, "场景创建失败");
    }
  },

  async update(scene) {
    try {
      const saved = await cueService.updateCueScene(scene);
      set({ rows: get().rows.map((row) => (row.id === saved.id ? saved : row)) });
      return saved;
    } catch (error) {
      throw new ControllerError(error as Error, "场景保存失败");
    }
  },

  async setStatus(scene, status) {
    const saved = await cueService.setCueStatus(scene, status);
    set({ rows: get().rows.map((row) => (row.id === saved.id ? saved : row)) });
  },

  async patchFixtureState(scene, fixtureId, state) {
    const saved = await cueService.patchFixtureState(scene, fixtureId, state);
    set({ rows: get().rows.map((row) => (row.id === saved.id ? saved : row)) });
  },

  async duplicate(scene) {
    const copy = await cueService.createCueScene({
      name: `${scene.name} 副本`,
      fixture_states: JSON.parse(JSON.stringify(scene.fixture_states)),
      fade_in_ms: scene.fade_in_ms,
      hold_ms: scene.hold_ms,
      priority: scene.priority,
      scene_status: "DRAFT"
    });
    set({ rows: [...get().rows, copy] });
    return copy;
  },

  async remove(scene) {
    try {
      await cueService.removeCueScene(scene);
      set({ rows: get().rows.filter((row) => row.id !== scene.id) });
    } catch (error) {
      throw new ControllerError(error as Error, "场景删除失败");
    }
  },

  async replaceAll(rows) {
    await cueService.replaceAllCueScenes(rows);
    set({ rows });
  }
}));
