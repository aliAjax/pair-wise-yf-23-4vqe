import type { CueScene } from "../types/CueScene";
import type { FixtureStateMap } from "../types/FixtureState";
import { createEmptyFixtureState } from "../types/FixtureState";
import { createId } from "../utils/id";

export interface CueSceneDraft {
  name: string;
  fixture_states: FixtureStateMap;
  fade_in_ms: number;
  hold_ms: number;
  priority: number;
  scene_status: CueScene["scene_status"];
}

/** 新场景表单默认对象：2 秒淡入、优先级 5 */
export function createCueSceneForm(overrides: Partial<CueSceneDraft> = {}): CueSceneDraft {
  return {
    name: "",
    fixture_states: {},
    fade_in_ms: 2000,
    hold_ms: 0,
    priority: 5,
    scene_status: "DRAFT",
    ...overrides
  };
}

export function createCueSceneFromDraft(draft: CueSceneDraft, id?: string): CueScene {
  return { id: id ?? createId("cue"), ...draft };
}

/** 给场景中的某台灯补一份默认灯态（黑场、居中） */
export function createFixtureStateEntry() {
  return createEmptyFixtureState();
}

export function createCueSceneFromImport(raw: Partial<CueScene>): CueScene {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createId("cue"),
    name: raw.name ?? "未命名场景",
    fixture_states: (raw.fixture_states ?? {}) as FixtureStateMap,
    fade_in_ms: Number(raw.fade_in_ms ?? 0),
    hold_ms: Number(raw.hold_ms ?? 0),
    priority: Number(raw.priority ?? 0),
    scene_status: raw.scene_status ?? "DRAFT"
  };
}

export const createDefaultCueScene = createCueSceneFromDraft;
export const createCueSceneResponse = createCueSceneFromDraft;
