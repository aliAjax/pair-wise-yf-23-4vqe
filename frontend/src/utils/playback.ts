import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { Fixture } from "../types/Fixture";
import type { FixtureState, FixtureStateMap } from "../types/FixtureState";
import type { FixtureRenderState, StageSnapshot } from "../types/StageSnapshot";
import { clamp01, lerpState } from "./color";
import { createEmptyFixtureState } from "../types/FixtureState";

export interface ActiveCue {
  track: TimelineTrack;
  scene: CueScene;
  /** 该片段在 timeMs 时刻的淡入进度 0-1 */
  progress: number;
}

/**
 * 时间轴上某时刻处于激活状态的场景。
 * 只有 READY 状态参与合成：草稿/停用/归档场景即使排上时间轴也保持黑场，
 * 便于彩排时先编排、确认就绪后再点亮。
 */
export function getActiveCues(
  timeMs: number,
  tracks: TimelineTrack[],
  scenesById: Map<string, CueScene>
): ActiveCue[] {
  return tracks
    .filter((track) => {
      const scene = scenesById.get(track.cue_scene_id);
      return (
        scene &&
        scene.scene_status === "READY" &&
        timeMs >= track.start_ms &&
        timeMs < track.start_ms + track.duration_ms
      );
    })
    .map((track) => {
      const scene = scenesById.get(track.cue_scene_id)!;
      const fade = Math.max(0, scene.fade_in_ms);
      const local = timeMs - track.start_ms;
      const progress = fade === 0 ? 1 : clamp01(local / fade);
      return { track, scene, progress };
    })
    .sort((a, b) => {
      // 高优先级覆盖低优先级；同优先级时更晚上轨道（layer 更大）者在上
      if (b.scene.priority !== a.scene.priority) return b.scene.priority - a.scene.priority;
      return b.track.layer - a.track.layer;
    });
}

/**
 * 按播放时刻叠加所有场景：逐灯取最高优先级场景，
 * 颜色/亮度/位置随淡入进度从黑场插值到目标值。
 */
export function composeSnapshot(
  timeMs: number,
  fixtures: Fixture[],
  tracks: TimelineTrack[],
  scenes: CueScene[]
): StageSnapshot {
  const scenesById = new Map(scenes.map((scene) => [scene.id, scene]));
  const active = getActiveCues(timeMs, tracks, scenesById);
  const winners = new Map<string, { target: FixtureState; progress: number; cueId: string }>();

  // active 已按优先级从高到低排序，逐灯只记第一个命中的场景
  active.forEach(({ scene, progress }) => {
    Object.entries(scene.fixture_states as FixtureStateMap).forEach(([fixtureId, target]) => {
      if (!winners.has(fixtureId)) winners.set(fixtureId, { target, progress, cueId: scene.id });
    });
  });

  const snapshot: StageSnapshot = {};
  fixtures.forEach((fixture) => {
    const base: FixtureRenderState = { ...createEmptyFixtureState(), active: false };
    const hit = winners.get(fixture.id);
    if (hit) {
      const rendered = lerpState(createEmptyFixtureState(), hit.target, hit.progress);
      snapshot[fixture.id] = {
        ...rendered,
        active: hit.progress > 0,
        sourceCueId: hit.cueId
      };
    } else {
      snapshot[fixture.id] = base;
    }
  });
  return snapshot;
}

/** 时间轴总时长：所有片段的最大结束时刻，至少 60s */
export function getTimelineEnd(tracks: TimelineTrack[], minMs: number): number {
  return tracks.reduce((max, track) => Math.max(max, track.start_ms + track.duration_ms), minMs);
}

export function isTrackInLayer(layer: number) {
  return (track: TimelineTrack) => track.layer === layer;
}
