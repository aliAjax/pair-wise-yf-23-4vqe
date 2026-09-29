import type { ShowProject } from "../types/ShowProject";
import type { ShowSnapshot } from "../types/ShowSnapshot";
import { useRepository } from "../stores/repository";
import { withLocalApi, delay } from "./localClient";
import { exportSnapshot, logProjectImported, logProjectUpdated, parseImportedSnapshot } from "../services/ShowProjectService";

export async function listShowProject(): Promise<ShowProject[]> {
  return withLocalApi(async () => {
    await delay();
    return [{ ...useRepository.getState().project }];
  });
}

export async function updateShowProject(patch: Partial<ShowProject>): Promise<ShowProject> {
  return withLocalApi(() => {
    const repo = useRepository.getState();
    const updated: ShowProject = {
      ...repo.project,
      ...patch,
      fixture_ids: repo.fixtures.map((fixture) => fixture.id),
      track_ids: repo.tracks.map((track) => track.id),
      updated_at: new Date().toISOString()
    };
    logProjectUpdated(repo.project, updated);
    repo.patch({ project: updated });
    return updated;
  });
}

export async function getSnapshot(): Promise<ShowSnapshot> {
  return withLocalApi(async () => {
    await delay();
    const repo = useRepository.getState();
    return {
      version: 1,
      project: repo.project,
      fixtures: repo.fixtures,
      cues: repo.cues,
      tracks: repo.tracks,
      timeline_meta: repo.timeline_meta,
      saved_at: new Date().toISOString()
    };
  });
}

export async function exportShowProject(): Promise<string> {
  return withLocalApi(async () => exportSnapshot(await getSnapshot()));
}

export async function importShowProject(raw: string): Promise<ShowSnapshot> {
  return withLocalApi(() => {
    const snapshot = parseImportedSnapshot(raw);
    logProjectImported(snapshot);
    useRepository.getState().hydrate(snapshot);
    return snapshot;
  });
}

export async function resetShowProject(factory: () => ShowSnapshot): Promise<void> {
  return withLocalApi(() => {
    useRepository.getState().hydrate(factory());
  });
}
