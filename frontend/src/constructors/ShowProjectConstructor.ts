import type { ShowProject } from "../types/ShowProject";

export function createDefaultShowProject(overrides: Partial<ShowProject> = {}): ShowProject {
  return {
    id: 1,
    title: "未命名彩排",
    venue_name: "一号排练厅",
    fixture_ids: [],
    track_ids: [],
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

export function createShowProjectResponse(raw: Partial<ShowProject>): ShowProject {
  return createDefaultShowProject({
    ...raw,
    id: Number(raw.id) || 1,
    title: String(raw.title ?? ""),
    venue_name: String(raw.venue_name ?? ""),
    fixture_ids: Array.isArray(raw.fixture_ids) ? raw.fixture_ids.map(Number) : [],
    track_ids: Array.isArray(raw.track_ids) ? raw.track_ids.map(Number) : []
  });
}
