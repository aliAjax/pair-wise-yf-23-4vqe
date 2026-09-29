import type { FixtureState } from "./FixtureState";

/** 播放合成后单台灯具的瞬时状态（颜色/位置均已做淡入插值） */
export interface FixtureRenderState extends FixtureState {
  /** 0-1，该灯是否被任何激活场景命中 */
  active: boolean;
  /** 命中该灯的最高优先级场景名称（用于调试浮层） */
  sourceCueId?: string;
}

export type StageSnapshot = Record<string, FixtureRenderState>;
