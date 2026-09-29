import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ShowProject } from "../../types/ShowProject";
import type { Fixture } from "../../types/Fixture";
import type { CueScene } from "../../types/CueScene";
import type { TimelineTrack, TimelineMeta } from "../../types/TimelineTrack";
import type { ShowSnapshot } from "../../types/ShowSnapshot";
import { buildSeedData } from "../../mocks/seedData";

/**
 * 演出仓库切片：方案 / 灯具 / 场景 / 轨道 / 图层锁。
 * 关闭页面再打开的数据恢复由 hydrate 完成，重置演示走 resetToSeed。
 */
export interface RepoState {
  ready: boolean;
  project: ShowProject;
  fixtures: Fixture[];
  cues: CueScene[];
  tracks: TimelineTrack[];
  timeline_meta: TimelineMeta;
}

function snapshotState(snapshot: ShowSnapshot): Omit<RepoState, "ready"> {
  return {
    project: snapshot.project,
    fixtures: snapshot.fixtures,
    cues: snapshot.cues,
    tracks: snapshot.tracks,
    timeline_meta: snapshot.timeline_meta
  };
}

const seed = buildSeedData();
const initialState: RepoState = {
  ready: false,
  project: seed.project,
  fixtures: seed.fixtures,
  cues: seed.cues,
  tracks: seed.tracks,
  timeline_meta: seed.timeline_meta
};

export type RepoPatch = Partial<Omit<RepoState, "ready">>;

const repoSlice = createSlice({
  name: "repo",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<ShowSnapshot>) {
      Object.assign(state, snapshotState(action.payload), { ready: true });
    },
    markReady(state) {
      state.ready = true;
    },
    resetToSeed(state) {
      Object.assign(state, snapshotState(buildSeedData()), { ready: true });
    },
    patch(state, action: PayloadAction<RepoPatch>) {
      Object.assign(state, action.payload);
    }
  }
});

export const repoActions = repoSlice.actions;
export const repoReducer = repoSlice.reducer;
