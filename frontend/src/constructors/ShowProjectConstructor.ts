import type { ShowProject } from "../types/ShowProject";
import { createId } from "../utils/id";

export interface ShowProjectDraft {
  title: string;
  venue_name: string;
  fixture_ids: string[];
  track_ids: string[];
}

/** 新方案表单默认对象 */
export function createShowProjectForm(overrides: Partial<ShowProjectDraft> = {}): ShowProjectDraft {
  return {
    title: "",
    venue_name: "",
    fixture_ids: [],
    track_ids: [],
    ...overrides
  };
}

export function createShowProjectFromDraft(draft: ShowProjectDraft, id?: string): ShowProject {
  return {
    id: id ?? createId("prj"),
    title: draft.title,
    venue_name: draft.venue_name,
    fixture_ids: draft.fixture_ids,
    track_ids: draft.track_ids,
    updated_at: new Date().toISOString()
  };
}

export function touchShowProject(project: ShowProject): ShowProject {
  return { ...project, updated_at: new Date().toISOString() };
}

export function createShowProjectFromImport(raw: Partial<ShowProject>): ShowProject {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createId("prj"),
    title: raw.title ?? "未命名方案",
    venue_name: raw.venue_name ?? "",
    fixture_ids: Array.isArray(raw.fixture_ids) ? raw.fixture_ids.map(String) : [],
    track_ids: Array.isArray(raw.track_ids) ? raw.track_ids.map(String) : [],
    updated_at: raw.updated_at ?? new Date().toISOString()
  };
}

export const createDefaultShowProject = createShowProjectFromDraft;
export const createShowProjectResponse = createShowProjectFromDraft;
