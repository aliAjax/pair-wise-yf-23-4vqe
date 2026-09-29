import type { ShowProject, ShowProjectId } from "../types/ShowProject";
import * as projectApi from "../api/ShowProject";
import {
  createShowProjectFromDraft,
  touchShowProject,
  type ShowProjectDraft
} from "../constructors/ShowProjectConstructor";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "../utils/errors";
import { writeLog } from "../utils/logger";
import { downloadJson, type ShowBackup } from "../utils/backup";
import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import {
  createFixtureFromImport,
  createCueSceneFromImport,
  createTimelineTrackFromImport,
  createShowProjectFromImport
} from "../constructors";

export async function listProjects(): Promise<ShowProject[]> {
  return projectApi.listShowProject();
}

export async function createProject(draft: ShowProjectDraft): Promise<ShowProject> {
  if (!draft.title.trim()) {
    throw new ServiceError(ERROR_CODES.VALIDATION_FAILED, { field: "方案标题不能为空" });
  }
  const project = createShowProjectFromDraft(draft);
  await projectApi.saveShowProject(project);
  await writeLog("ShowProject", "CREATE", { name: project.title });
  return project;
}

/** 灯具/场景/轨道变动后刷新 updated_at 与引用 id */
export async function saveProject(project: ShowProject): Promise<ShowProject> {
  const touched = touchShowProject(project);
  await projectApi.saveShowProject(touched);
  await writeLog("ShowProject", "UPDATE", { name: touched.title });
  return touched;
}

export async function removeProject(id: ShowProjectId, title: string): Promise<void> {
  await projectApi.deleteShowProject(id);
  await writeLog("ShowProject", "DELETE", { name: title });
}

/** 方案/灯具/场景/轨道整体导出为 JSON */
export async function exportBackup(
  project: ShowProject,
  fixtures: Fixture[],
  cueScenes: CueScene[],
  tracks: TimelineTrack[]
): Promise<void> {
  const backup: ShowBackup = {
    app: "stage-light",
    version: 1,
    exported_at: new Date().toISOString(),
    fixture: fixtures,
    cueScene: cueScenes,
    timelineTrack: tracks,
    showProject: [project]
  };
  downloadJson(`stage-light-${project.title || "backup"}.json`, backup);
  await writeLog("ShowProject", "EXPORT", { name: project.title });
}

export interface ParsedBackup {
  fixtures: Fixture[];
  cueScenes: CueScene[];
  tracks: TimelineTrack[];
  projects: ShowProject[];
}

/** 导入文件解析 + 逐行构造器兜底，非法结构直接抛业务异常 */
export function parseBackup(raw: unknown): ParsedBackup {
  const data = raw as Partial<ShowBackup>;
  if (!raw || typeof raw !== "object" || data.app !== "stage-light" || !Array.isArray(data.fixture)) {
    throw new ServiceError(ERROR_CODES.IMPORT_PAYLOAD_INVALID, { field: "缺少 app=stage-light 或实体数组" });
  }
  return {
    fixtures: (data.fixture ?? []).map((row) => createFixtureFromImport(row as Partial<Fixture>)),
    cueScenes: (data.cueScene ?? []).map((row) => createCueSceneFromImport(row as Partial<CueScene>)),
    tracks: (data.timelineTrack ?? []).map((row) => createTimelineTrackFromImport(row as Partial<TimelineTrack>)),
    projects: (data.showProject ?? []).map((row) => createShowProjectFromImport(row as Partial<ShowProject>))
  };
}
