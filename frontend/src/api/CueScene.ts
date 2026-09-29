import type { CueScene } from "../types/CueScene";
import type { CueStatus } from "../types/CueStatus";
import { useRepository } from "../stores/repository";
import { withLocalApi, delay } from "./localClient";
import {
  assertCueSavable,
  buildCueDraft,
  findCue,
  logCueCreated,
  logCueRemoved,
  logCueStatusChanged,
  logCueUpdated
} from "../services/CueSceneService";
import { nextId } from "../utils/id";

export async function listCueScene(): Promise<CueScene[]> {
  return withLocalApi(async () => {
    await delay();
    return useRepository.getState().cues.map((row) => structuredClone(row));
  });
}

export async function createCueDraft(): Promise<CueScene> {
  return withLocalApi(() => buildCueDraft());
}

export async function saveCueScene(payload: CueScene): Promise<CueScene> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    assertCueSavable(payload);
    const existing = repo.cues.find((row) => row.id === payload.id);
    if (existing) {
      logCueUpdated(existing, payload);
      repo.patch({ cues: repo.cues.map((row) => (row.id === payload.id ? payload : row)) });
      return payload;
    }
    const created: CueScene = { ...structuredClone(payload), id: nextId(repo.cues) };
    logCueCreated(created);
    repo.patch({ cues: [...repo.cues, created] });
    return created;
  });
}

export async function updateCueStatus(id: number, status: CueStatus): Promise<void> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    const cue = findCue(repo.cues, id);
    if (cue.scene_status === status) return;
    logCueStatusChanged(cue, cue.scene_status, status);
    repo.patch({
      cues: repo.cues.map((row) => (row.id === id ? { ...row, scene_status: status } : row))
    });
  });
}

export async function deleteCueScene(id: number): Promise<void> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    const cue = findCue(repo.cues, id);
    logCueRemoved(cue);
    repo.patch({
      cues: repo.cues.filter((row) => row.id !== id),
      tracks: repo.tracks.filter((track) => track.cue_scene_id !== id),
      project: {
        ...repo.project,
        track_ids: repo.project.track_ids.filter(
          (tid) => !repo.tracks.some((track) => track.id === tid && track.cue_scene_id === id)
        ),
        updated_at: new Date().toISOString()
      }
    });
  });
}
