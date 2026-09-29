import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { ShowProject } from "../types/ShowProject";
import type { FixtureState } from "../types/FixtureState";

/** 首启种子数据：DMX 地址逐台排布不压线，片段同层不重叠，可直接试演。 */

function state(partial: Partial<FixtureState> = {}): FixtureState {
  return {
    r: 0,
    g: 0,
    b: 0,
    w: 0,
    dimmer: 0,
    target_x: 50,
    target_y: 50,
    ...partial
  };
}

const fixtures: Fixture[] = [
  { id: "fx-1", fixture_code: "FACE-L-01", fixture_type: "WASH", position_x: 22, position_y: 18, dmx_address: 1, channel_count: 4, color_mode: "RGBW" },
  { id: "fx-2", fixture_code: "FACE-R-01", fixture_type: "WASH", position_x: 78, position_y: 18, dmx_address: 5, channel_count: 4, color_mode: "RGBW" },
  { id: "fx-3", fixture_code: "BEAM-C-01", fixture_type: "BEAM", position_x: 50, position_y: 12, dmx_address: 9, channel_count: 6, color_mode: "MOVING_HEAD" },
  { id: "fx-4", fixture_code: "BEAM-L-01", fixture_type: "BEAM", position_x: 35, position_y: 14, dmx_address: 15, channel_count: 6, color_mode: "MOVING_HEAD" },
  { id: "fx-5", fixture_code: "BEAM-R-01", fixture_type: "BEAM", position_x: 65, position_y: 14, dmx_address: 21, channel_count: 6, color_mode: "MOVING_HEAD" },
  { id: "fx-6", fixture_code: "PAR-DS-01", fixture_type: "PAR", position_x: 12, position_y: 55, dmx_address: 27, channel_count: 3, color_mode: "RGB" },
  { id: "fx-7", fixture_code: "PAR-DS-02", fixture_type: "PAR", position_x: 88, position_y: 55, dmx_address: 30, channel_count: 3, color_mode: "RGB" },
  { id: "fx-8", fixture_code: "SPOT-SL-01", fixture_type: "SPOT", position_x: 50, position_y: 30, dmx_address: 33, channel_count: 3, color_mode: "RGB" },
  { id: "fx-9", fixture_code: "STR-BK-01", fixture_type: "STROBE", position_x: 50, position_y: 8, dmx_address: 36, channel_count: 1, color_mode: "DIMMER_ONLY" }
];

const cueScenes: CueScene[] = [
  {
    id: "cue-1",
    name: "开场暖场",
    fade_in_ms: 2000,
    hold_ms: 0,
    priority: 5,
    scene_status: "READY",
    fixture_states: {
      "fx-1": state({ w: 180, dimmer: 200 }),
      "fx-2": state({ w: 180, dimmer: 200 }),
      "fx-6": state({ r: 255, g: 150, b: 40, dimmer: 160 }),
      "fx-7": state({ r: 255, g: 150, b: 40, dimmer: 160 })
    }
  },
  {
    id: "cue-2",
    name: "蓝色合唱",
    fade_in_ms: 1500,
    hold_ms: 0,
    priority: 6,
    scene_status: "READY",
    fixture_states: {
      "fx-1": state({ b: 230, w: 40, dimmer: 220 }),
      "fx-2": state({ b: 230, w: 40, dimmer: 220 }),
      "fx-8": state({ b: 255, g: 120, dimmer: 230 }),
      "fx-6": state({ b: 200, dimmer: 140 }),
      "fx-7": state({ b: 200, dimmer: 140 })
    }
  },
  {
    id: "cue-3",
    name: "主唱追光",
    fade_in_ms: 800,
    hold_ms: 0,
    priority: 8,
    scene_status: "READY",
    fixture_states: {
      "fx-3": state({ w: 255, dimmer: 255, target_x: 50, target_y: 62 }),
      "fx-8": state({ w: 255, r: 255, g: 245, b: 220, dimmer: 255 })
    }
  },
  {
    id: "cue-4",
    name: "高潮频闪",
    fade_in_ms: 200,
    hold_ms: 0,
    priority: 9,
    scene_status: "READY",
    fixture_states: {
      "fx-9": state({ w: 255, dimmer: 255 }),
      "fx-4": state({ r: 255, g: 30, b: 30, dimmer: 255, target_x: 30, target_y: 80 }),
      "fx-5": state({ r: 255, g: 30, b: 30, dimmer: 255, target_x: 70, target_y: 80 })
    }
  },
  {
    id: "cue-5",
    name: "谢幕白场（草稿）",
    fade_in_ms: 3000,
    hold_ms: 0,
    priority: 4,
    scene_status: "DRAFT",
    fixture_states: {
      "fx-1": state({ w: 255, dimmer: 255 }),
      "fx-2": state({ w: 255, dimmer: 255 }),
      "fx-8": state({ w: 255, dimmer: 255 })
    }
  }
];

const timelineTracks: TimelineTrack[] = [
  // 同层片段首尾相接但不重叠；跨层可以同时刻叠加
  { id: "trk-1", cue_scene_id: "cue-1", start_ms: 0, duration_ms: 12000, layer: 1, locked: false },
  { id: "trk-2", cue_scene_id: "cue-2", start_ms: 12000, duration_ms: 14000, layer: 1, locked: false },
  { id: "trk-3", cue_scene_id: "cue-1", start_ms: 26000, duration_ms: 8000, layer: 1, locked: false },
  { id: "trk-4", cue_scene_id: "cue-3", start_ms: 14000, duration_ms: 12000, layer: 2, locked: true },
  { id: "trk-5", cue_scene_id: "cue-3", start_ms: 26000, duration_ms: 6000, layer: 2, locked: true },
  { id: "trk-6", cue_scene_id: "cue-4", start_ms: 22000, duration_ms: 4000, layer: 3, locked: false }
];

const showProjects: ShowProject[] = [
  {
    id: "prj-1",
    title: "2026 秋季联排",
    venue_name: "一号排练厅",
    fixture_ids: fixtures.map((fixture) => fixture.id),
    track_ids: timelineTracks.map((track) => track.id),
    updated_at: "2026-09-28T19:30:00+08:00"
  }
];

export const seedData = {
  fixture: fixtures,
  cueScene: cueScenes,
  timelineTrack: timelineTracks,
  showProject: showProjects
};

/** 旧引用名（部分模块按 mockData 命名） */
export const mockData = seedData;
