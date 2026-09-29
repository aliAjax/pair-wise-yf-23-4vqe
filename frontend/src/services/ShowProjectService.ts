import type { ShowProject } from "../types/ShowProject";
import type { ShowSnapshot } from "../types/ShowSnapshot";
import { logAction } from "./logger";
import { createShowProjectResponse } from "../constructors/ShowProjectConstructor";
import { createFixtureResponse } from "../constructors/FixtureConstructor";
import { createCueSceneResponse } from "../constructors/CueSceneConstructor";
import { createTimelineTrackResponse } from "../constructors/TimelineTrackConstructor";
import { ERROR_CODES } from "../constants/errorCodes";
import { formatErrorMessage } from "../constants/errorMessages";
import { BusinessError } from "./BusinessError";

export function logProjectUpdated(before: ShowProject, after: ShowProject): void {
  const fields = Object.keys(after).filter((key) => key !== "id" && (before as never as Record<string, unknown>)[key] !== (after as never as Record<string, unknown>)[key]).join(",");
  logAction("ShowProject", "update", { title: after.title, fields: fields || "无" });
}

export function logProjectExported(snapshot: ShowSnapshot): void {
  logAction("ShowProject", "export", {
    title: snapshot.project.title,
    fixtures: snapshot.fixtures.length,
    cues: snapshot.cues.length,
    tracks: snapshot.tracks.length
  });
}

export function logProjectImported(snapshot: ShowSnapshot): void {
  logAction("ShowProject", "import", { title: snapshot.project.title });
}

/** 导出快照为格式化 JSON（下载在页面层触发） */
export function exportSnapshot(snapshot: ShowSnapshot): string {
  logProjectExported(snapshot);
  return JSON.stringify(snapshot, null, 2);
}

/** 校验并归一化导入 JSON */
export function parseImportedSnapshot(raw: string): ShowSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new BusinessError(
      ERROR_CODES.IMPORT_INVALID,
      formatErrorMessage(ERROR_CODES.IMPORT_INVALID, { reason: "JSON 解析失败" }),
      { reason: (error as Error).message }
    );
  }
  const value = parsed as Partial<ShowSnapshot>;
  if (!value || typeof value !== "object" || !value.project || !Array.isArray(value.fixtures) || !Array.isArray(value.cues) || !Array.isArray(value.tracks)) {
    throw new BusinessError(
      ERROR_CODES.IMPORT_INVALID,
      formatErrorMessage(ERROR_CODES.IMPORT_INVALID, { reason: "缺少 project/fixtures/cues/tracks 字段" }),
      { reason: "schema" }
    );
  }
  return {
    version: 1,
    project: createShowProjectResponse(value.project),
    fixtures: value.fixtures.map(createFixtureResponse),
    cues: value.cues.map(createCueSceneResponse),
    tracks: value.tracks.map(createTimelineTrackResponse),
    timeline_meta: {
      layer_count: Number(value.timeline_meta?.layer_count) || 4,
      locks: value.timeline_meta?.locks ?? {}
    },
    saved_at: new Date().toISOString()
  };
}
