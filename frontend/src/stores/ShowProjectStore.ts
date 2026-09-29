import { create } from "zustand";
import type { ShowProject } from "../types/ShowProject";
import type { ShowProjectDraft } from "../constructors/ShowProjectConstructor";
import * as projectService from "../services/ShowProjectService";
import { ControllerError } from "../utils/errors";

interface ShowProjectStoreState {
  rows: ShowProject[];
  activeId: string | null;
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  create: (draft: ShowProjectDraft) => Promise<ShowProject>;
  save: (project: ShowProject) => Promise<ShowProject>;
  remove: (id: string) => Promise<void>;
  setActive: (id: string) => void;
  getActive: () => ShowProject | undefined;
  replaceAll: (rows: ShowProject[]) => void;
}

export const useShowProjectStore = create<ShowProjectStoreState>((set, get) => ({
  rows: [],
  activeId: null,
  loading: false,
  loaded: false,

  async load() {
    set({ loading: true });
    try {
      const rows = await projectService.listProjects();
      set({
        rows,
        loading: false,
        loaded: true,
        activeId: get().activeId ?? rows[0]?.id ?? null
      });
    } catch (error) {
      set({ loading: false });
      throw new ControllerError(error as Error, "演出方案加载失败");
    }
  },

  async create(draft) {
    try {
      const project = await projectService.createProject(draft);
      set({ rows: [...get().rows, project], activeId: project.id });
      return project;
    } catch (error) {
      throw new ControllerError(error as Error, "方案创建失败");
    }
  },

  async save(project) {
    const saved = await projectService.saveProject(project);
    set({ rows: get().rows.map((row) => (row.id === saved.id ? saved : row)) });
    return saved;
  },

  async remove(id) {
    const target = get().rows.find((row) => row.id === id);
    if (!target) return;
    await projectService.removeProject(id, target.title);
    const rows = get().rows.filter((row) => row.id !== id);
    set({ rows, activeId: get().activeId === id ? rows[0]?.id ?? null : get().activeId });
  },

  setActive(id) {
    set({ activeId: id });
  },

  getActive() {
    const { rows, activeId } = get();
    return rows.find((row) => row.id === activeId) ?? rows[0];
  },

  replaceAll(rows) {
    set({ rows, activeId: rows[0]?.id ?? null });
  }
}));
