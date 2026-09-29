import { useMemo } from "react";
import { rootStore, repoApi } from "./redux/store";
import { repoActions, type RepoPatch, type RepoState } from "./redux/repoSlice";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { STORAGE_CONSTANTS } from "../constants/appConfig";
import { idbGet } from "../utils/indexedDb";
import type { ShowSnapshot } from "../types/ShowSnapshot";
import type { ShowProject } from "../types/ShowProject";
import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack, TimelineMeta } from "../types/TimelineTrack";

/**
 * 演出仓库外观：底层为 Redux Toolkit 的 repo 切片（stores/redux/repoSlice），
 * 方案 / 灯具 / 场景 / 轨道 / 图层锁统一在此，写操作自动持久化到
 * localStorage（镜像秒开）+ IndexedDB（主持久层）。
 * actions 引用保持稳定，避免订阅链路里出现无限重渲染。
 */
export interface RepositoryFacade extends RepoState {
  hydrate: (snapshot: ShowSnapshot) => void;
  resetToSeed: () => void;
  patch: (partial: RepoPatch) => void;
}

export interface RepositoryStoreHook {
  (): RepositoryFacade;
  <T>(selector: (facade: RepositoryFacade) => T): T;
  getState(): RepositoryFacade;
  subscribe(listener: (facade: RepositoryFacade) => void): () => void;
  setState(patch: { ready?: boolean }): void;
}

function actionsFor(dispatch: typeof rootStore.dispatch) {
  return {
    hydrate: (snapshot: ShowSnapshot) => dispatch(repoActions.hydrate(snapshot)),
    resetToSeed: () => dispatch(repoActions.resetToSeed()),
    patch: (partial: RepoPatch) => dispatch(repoActions.patch(partial))
  };
}

function facade(state: RepoState, actions: ReturnType<typeof actionsFor>): RepositoryFacade {
  return {
    ready: state.ready,
    project: state.project,
    fixtures: state.fixtures,
    cues: state.cues,
    tracks: state.tracks,
    timeline_meta: state.timeline_meta,
    ...actions
  };
}

export const useRepository: RepositoryStoreHook = function useRepository<T>(selector?: (facade: RepositoryFacade) => T): T | RepositoryFacade {
  const state = useAppSelector((root) => root.repo);
  const dispatch = useAppDispatch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const actions = useMemo(() => actionsFor(dispatch), [dispatch]);
  const value = useMemo(() => facade(state, actions), [state, actions]);
  return selector ? selector(value) : value;
};

useRepository.getState = () => facade(rootStore.getState().repo, actionsFor(rootStore.dispatch));

useRepository.subscribe = (listener: (facade: RepositoryFacade) => void) =>
  rootStore.subscribe(() => listener(useRepository.getState()));

useRepository.setState = (patch: { ready?: boolean }) => {
  if (patch.ready) repoApi.markReady();
};

/** 启动时读取本地数据：localStorage 秒开，IndexedDB 兜底 */
export async function loadLocalSnapshot(): Promise<ShowSnapshot | null> {
  try {
    const lsRaw = localStorage.getItem(STORAGE_CONSTANTS.LS_KEY);
    if (lsRaw) return JSON.parse(lsRaw) as ShowSnapshot;
  } catch {
    // 落到 IndexedDB
  }
  const fromIdb = await idbGet<ShowSnapshot>(STORAGE_CONSTANTS.IDB_KEY);
  return fromIdb ?? null;
}

export type { ShowProject, Fixture, CueScene, TimelineTrack, TimelineMeta };
