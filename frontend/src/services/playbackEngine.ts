import type { Fixture, FixtureState } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { RgbColor } from "../utils/color";
import { applyBrightness, mixColor, clampRatio } from "../utils/color";
import { PLAYABLE_CUE_STATUSES } from "../constants/CueStatus";

export interface RenderedFixture {
  fixture: Fixture;
  color: RgbColor;
  /** 0-1，0 表示熄灭（舞台上不发光） */
  intensity: number;
  x: number;
  y: number;
  /** 当前生效的场景名列表（低 -> 高优先级），供调试展示 */
  activeCues: string[];
}

interface ActiveContribution {
  cue: CueScene;
  state: FixtureState;
  /** 淡入进度 0-1 */
  fade: number;
}

/**
 * 舞台预览核心：按播放时刻 t 找出所有“正在演出”的轨道块，
 * 同刻叠加时高优先级覆盖低优先级（颜色、亮度），
 * 摇头灯位置在淡入期间从上一台灯位插值到目标位。
 */
export function renderStageAt(
  timeMs: number,
  fixtures: Fixture[],
  cues: CueScene[],
  tracks: TimelineTrack[]
): RenderedFixture[] {
  const cueById = new Map(cues.map((cue) => [cue.id, cue]));

  // 每个灯具收集此刻生效的场景贡献
  const contributions = new Map<number, ActiveContribution[]>();
  for (const track of tracks) {
    if (timeMs < track.start_ms || timeMs >= track.start_ms + track.duration_ms) continue;
    const cue = cueById.get(track.cue_scene_id);
    if (!cue || !PLAYABLE_CUE_STATUSES.includes(cue.scene_status)) continue;
    const elapsed = timeMs - track.start_ms;
    const fade = cue.fade_in_ms > 0 ? clampRatio(elapsed / cue.fade_in_ms) : 1;
    for (const state of cue.fixture_states) {
      const list = contributions.get(state.fixture_id) ?? [];
      list.push({ cue, state, fade });
      contributions.set(state.fixture_id, list);
    }
  }

  return fixtures.map((fixture) => {
    const list = (contributions.get(fixture.id) ?? [])
      .slice()
      // 高优先级覆盖低优先级；同优先级时后开始的覆盖（更晚加入时间轴）
      .sort((a, b) => a.cue.priority - b.cue.priority || a.cue.id - b.cue.id);

    if (list.length === 0) {
      return { fixture, color: { r: 0, g: 0, b: 0 }, intensity: 0, x: fixture.position_x, y: fixture.position_y, activeCues: [] };
    }

    // 从黑场向第一层贡献淡入，之后逐层混合
    let color: RgbColor = { r: 0, g: 0, b: 0 };
    let intensity = 0;
    let x = fixture.position_x;
    let y = fixture.position_y;
    const top = list[list.length - 1];

    list.forEach((entry, index) => {
      const target = applyBrightness(entry.state.color, entry.state.brightness);
      const targetIntensity = clampRatio(entry.state.brightness / 100) * entry.fade;
      if (index === 0) {
        color = mixColor({ r: 0, g: 0, b: 0 }, target, entry.fade);
        intensity = targetIntensity;
        x = lerp(fixture.position_x, entry.state.target_x ?? fixture.position_x, entry.fade);
        y = lerp(fixture.position_y, entry.state.target_y ?? fixture.position_y, entry.fade);
      } else {
        // 高优先级层按自己的淡入进度覆盖低层
        color = mixColor(color, target, entry.fade);
        intensity = lerp(intensity, targetIntensity, entry.fade);
        x = lerp(x, entry.state.target_x ?? x, entry.fade);
        y = lerp(y, entry.state.target_y ?? y, entry.fade);
      }
    });

    // 未被最高层覆盖到的通道保持低层颜色 —— 混合已在上面完成
    void top;
    return {
      fixture,
      color,
      intensity,
      x,
      y,
      activeCues: list.map((entry) => entry.cue.name)
    };
  });
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * clampRatio(t);
}

/** 时间轴总时长：所有轨道块结束时间的最大值（至少 10s） */
export function timelineDuration(tracks: TimelineTrack[]): number {
  return Math.max(10000, ...tracks.map((track) => track.start_ms + track.duration_ms));
}
