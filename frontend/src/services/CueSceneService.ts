import type { CueScene } from "../types/CueScene";
import type { FixtureState } from "../types/FixtureState";
import * as cueApi from "../api/CueScene";
import { createCueSceneFromDraft, type CueSceneDraft } from "../constructors/CueSceneConstructor";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "../utils/errors";
import { writeLog } from "../utils/logger";
import { CueStatusText } from "../constants/CueStatus";

function validateDraft(draft: CueSceneDraft): void {
  if (!draft.name.trim()) {
    throw new ServiceError(ERROR_CODES.VALIDATION_FAILED, { field: "场景名称不能为空" });
  }
  if (draft.fade_in_ms < 0 || draft.hold_ms < 0) {
    throw new ServiceError(ERROR_CODES.VALIDATION_FAILED, { field: "淡入/保持时间不能为负" });
  }
}

export async function listCueScenes(): Promise<CueScene[]> {
  return cueApi.listCueScene();
}

export async function createCueScene(draft: CueSceneDraft): Promise<CueScene> {
  validateDraft(draft);
  const scene = createCueSceneFromDraft(draft);
  await cueApi.saveCueScene(scene);
  await writeLog("CueScene", "CREATE", { name: scene.name });
  return scene;
}

export async function updateCueScene(scene: CueScene): Promise<CueScene> {
  if (!scene.name.trim()) {
    throw new ServiceError(ERROR_CODES.VALIDATION_FAILED, { field: "场景名称不能为空" });
  }
  await cueApi.saveCueScene(scene);
  await writeLog("CueScene", "UPDATE", { name: scene.name });
  return scene;
}

export async function setCueStatus(scene: CueScene, status: CueScene["scene_status"]): Promise<CueScene> {
  const next = { ...scene, scene_status: status };
  await cueApi.saveCueScene(next);
  await writeLog("CueScene", "STATUS", { name: scene.name, detail: CueStatusText[status] });
  return next;
}

export async function removeCueScene(scene: CueScene): Promise<void> {
  await cueApi.deleteCueScene(scene.id);
  await writeLog("CueScene", "DELETE", { name: scene.name });
}

export async function replaceAllCueScenes(rows: CueScene[]): Promise<void> {
  await cueApi.saveCueSceneMany(rows);
}

/** 场景编辑页调整单台灯状态后局部更新 */
export async function patchFixtureState(
  scene: CueScene,
  fixtureId: string,
  state: FixtureState
): Promise<CueScene> {
  const next: CueScene = {
    ...scene,
    fixture_states: { ...scene.fixture_states, [fixtureId]: state }
  };
  await cueApi.saveCueScene(next);
  return next;
}
