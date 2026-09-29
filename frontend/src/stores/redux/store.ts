import { configureStore } from "@reduxjs/toolkit";
import { repoReducer, repoActions } from "./repoSlice";
import { uiReducer, uiActions } from "./uiSlice";
import { STORAGE_CONSTANTS } from "../../constants/appConfig";
import { idbSet } from "../../utils/indexedDb";
import type { ShowSnapshot } from "../../types/ShowSnapshot";

/**
 * 全局 Redux 根 store：repo（方案/灯具/场景/轨道）+ ui（toast/日志）。
 * 各实体的 zustand store（FixtureStore 等）作为独立实体缓存层订阅 repo。
 */
export const rootStore = configureStore({
  reducer: {
    repo: repoReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof rootStore.getState>;
export type AppDispatch = typeof rootStore.dispatch;

/** repo 变化防抖落 localStorage（秒开镜像）+ IndexedDB（主持久层） */
let persistTimer: number | undefined;
rootStore.subscribe(() => {
  const { repo } = rootStore.getState();
  if (!repo.ready) return;
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    const snapshot: ShowSnapshot = {
      version: 1,
      project: repo.project,
      fixtures: repo.fixtures,
      cues: repo.cues,
      tracks: repo.tracks,
      timeline_meta: repo.timeline_meta,
      saved_at: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_CONSTANTS.LS_KEY, JSON.stringify(snapshot));
    } catch {
      // localStorage 不可用时 IndexedDB 兜底
    }
    void idbSet(STORAGE_CONSTANTS.IDB_KEY, snapshot).catch(() => undefined);
  }, 120);
});

/** 非组件环境（services/api）使用的命令式 UI API */
export const uiApi = {
  pushToast(kind: "success" | "error" | "info", message: string) {
    rootStore.dispatch(uiActions.toastAdded(kind, message));
    const toasts = rootStore.getState().ui.toasts;
    const id = toasts[toasts.length - 1]?.id;
    if (id !== undefined) {
      window.setTimeout(() => rootStore.dispatch(uiActions.toastDismissed(id)), 3600);
    }
  },
  pushLog(entity: string, message: string) {
    rootStore.dispatch(uiActions.logAdded(entity, message));
  }
};

export const repoApi = {
  hydrate(snapshot: ShowSnapshot) {
    rootStore.dispatch(repoActions.hydrate(snapshot));
  },
  markReady() {
    rootStore.dispatch(repoActions.markReady());
  },
  resetToSeed() {
    rootStore.dispatch(repoActions.resetToSeed());
  }
};
