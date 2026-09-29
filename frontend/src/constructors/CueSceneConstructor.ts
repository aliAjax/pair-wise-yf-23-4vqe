import type { CueScene } from "../types/CueScene";

/** 默认场景（新建表单）：2s 淡入、4s 保持、优先级 10 */
export function createDefaultCueScene(overrides: Partial<CueScene> = {}): CueScene {
  return {
    id: 0,
    name: "",
    fixture_states: [],
    fade_in_ms: 2000,
    hold_ms: 4000,
    priority: 10,
    scene_status: "DRAFT",
    ...overrides
  };
}

/** 导入响应构造 */
export function createCueSceneResponse(raw: Partial<CueScene>): CueScene {
  const base = createDefaultCueScene({ ...raw, id: Number(raw.id) || 0, name: String(raw.name ?? "") });
  return {
    ...base,
    fixture_states: Array.isArray(raw.fixture_states)
      ? raw.fixture_states.map((state) => ({
          fixture_id: Number(state?.fixture_id) || 0,
          color: String(state?.color ?? "#ffffff"),
          brightness: Number(state?.brightness) || 0,
          ...(state?.target_x !== undefined ? { target_x: Number(state.target_x) } : {}),
          ...(state?.target_y !== undefined ? { target_y: Number(state.target_y) } : {})
        }))
      : [],
    fade_in_ms: Number(raw.fade_in_ms) || 0,
    hold_ms: Number(raw.hold_ms) || 0,
    priority: Number(raw.priority) || 0
  };
}
