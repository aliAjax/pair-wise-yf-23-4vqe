import type { CueScene } from "../types/CueScene";
import type { CueStatus } from "../types/CueStatus";
import type { FixtureState } from "../types/Fixture";
import { ERROR_CODES } from "../constants/errorCodes";
import { formatErrorMessage } from "../constants/errorMessages";
import { BusinessError } from "./BusinessError";
import { logAction } from "./logger";
import { createDefaultCueScene } from "../constructors/CueSceneConstructor";
import { TIMELINE_CONSTANTS } from "../constants/appConfig";
import { CUE_STATUS_TEXT } from "../constants/CueStatus";

export function buildCueDraft(): CueScene {
  return createDefaultCueScene({ name: `新场景 ${Date.now() % 100000}` });
}

export function validateCue(cue: CueScene): string[] {
  const errors: string[] = [];
  if (!cue.name.trim()) errors.push(formatErrorMessage(ERROR_CODES.VALIDATION_FAILED, { field: "场景名称" }));
  if (cue.fade_in_ms < 0 || cue.fade_in_ms > 600000) {
    errors.push(formatErrorMessage(ERROR_CODES.VALIDATION_FAILED, { field: "淡入时间应在 0-600000ms 之间" }));
  }
  if (cue.hold_ms < 0) errors.push(formatErrorMessage(ERROR_CODES.VALIDATION_FAILED, { field: "保持时间不能为负" }));
  if (cue.priority < 0 || cue.priority > TIMELINE_CONSTANTS.MAX_SCENE_PRIORITY) {
    errors.push(formatErrorMessage(ERROR_CODES.VALIDATION_FAILED, { field: `优先级应在 0-${TIMELINE_CONSTANTS.MAX_SCENE_PRIORITY}` }));
  }
  return errors;
}

export function assertCueSavable(cue: CueScene): void {
  const errors = validateCue(cue);
  if (errors.length > 0) throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, errors[0], { field: "场景表单" });
}

/** 场景内的灯态增改：同一灯具以最新编辑为准 */
export function upsertFixtureState(cue: CueScene, state: FixtureState): CueScene {
  const exists = cue.fixture_states.some((item) => item.fixture_id === state.fixture_id);
  return {
    ...cue,
    fixture_states: exists
      ? cue.fixture_states.map((item) => (item.fixture_id === state.fixture_id ? state : item))
      : [...cue.fixture_states, state]
  };
}

export function removeFixtureState(cue: CueScene, fixtureId: number): CueScene {
  return { ...cue, fixture_states: cue.fixture_states.filter((item) => item.fixture_id !== fixtureId) };
}

export function findCue(cues: CueScene[], id: number): CueScene {
  const cue = cues.find((item) => item.id === id);
  if (!cue) throw new BusinessError(ERROR_CODES.CUE_NOT_FOUND, formatErrorMessage(ERROR_CODES.CUE_NOT_FOUND, { id }), { id });
  return cue;
}

export function logCueCreated(cue: CueScene): void {
  logAction("CueScene", "create", { name: cue.name, fade: cue.fade_in_ms, priority: cue.priority });
}

export function logCueUpdated(before: CueScene, after: CueScene): void {
  const fields = Object.keys(after).filter((key) => key !== "id" && (before as never as Record<string, unknown>)[key] !== (after as never as Record<string, unknown>)[key]).join(",");
  logAction("CueScene", "update", { name: after.name, fields: fields || "无" });
}

export function logCueRemoved(cue: CueScene): void {
  logAction("CueScene", "remove", { name: cue.name, count: cue.fixture_states.length });
}

export function logCueStatusChanged(cue: CueScene, from: CueStatus, to: CueStatus): void {
  logAction("CueScene", "status", { name: cue.name, from: CUE_STATUS_TEXT[from], to: CUE_STATUS_TEXT[to] });
}
