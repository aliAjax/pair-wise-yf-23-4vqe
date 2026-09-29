import type { Fixture } from "../types/Fixture";
import { useRepository } from "../stores/repository";
import { withLocalApi, delay } from "./localClient";
import {
  assertFixtureSavable,
  buildFixtureDraft,
  logFixtureCreated,
  logFixtureRemoved,
  logFixtureUpdated
} from "../services/FixtureService";
import { nextId } from "../utils/id";
import { createFixtureResponse } from "../constructors/FixtureConstructor";
import type { ChannelMode } from "../types/ChannelMode";

/** 本地模拟 API：按模型分文件封装 async 接口，实际读写仓库 + IndexedDB */
export async function listFixture(): Promise<Fixture[]> {
  return withLocalApi(async () => {
    await delay();
    return useRepository.getState().fixtures.map((row) => ({ ...row }));
  });
}

export async function createFixtureDraft(mode: ChannelMode): Promise<Fixture> {
  return withLocalApi(() => buildFixtureDraft(mode, useRepository.getState().fixtures));
}

export async function saveFixture(payload: Fixture): Promise<Fixture> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    const existing = repo.fixtures.find((row) => row.id === payload.id);
    if (existing) {
      assertFixtureSavable(payload, repo.fixtures);
      logFixtureUpdated(existing, payload);
      repo.patch({ fixtures: repo.fixtures.map((row) => (row.id === payload.id ? payload : row)) });
      return payload;
    }
    const created: Fixture = { ...createFixtureResponse(payload), id: nextId(repo.fixtures) };
    assertFixtureSavable(created, repo.fixtures);
    logFixtureCreated(created);
    repo.patch({
      fixtures: [...repo.fixtures, created],
      project: { ...repo.project, fixture_ids: [...repo.project.fixture_ids, created.id], updated_at: new Date().toISOString() }
    });
    return created;
  });
}

export async function deleteFixture(id: number): Promise<void> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    const target = repo.fixtures.find((row) => row.id === id);
    if (!target) return;
    logFixtureRemoved(target);
    // 同时清理场景中该灯的灯态、方案引用
    repo.patch({
      fixtures: repo.fixtures.filter((row) => row.id !== id),
      cues: repo.cues.map((cue) => ({
        ...cue,
        fixture_states: cue.fixture_states.filter((state) => state.fixture_id !== id)
      })),
      project: {
        ...repo.project,
        fixture_ids: repo.project.fixture_ids.filter((fid) => fid !== id),
        updated_at: new Date().toISOString()
      }
    });
  });
}
