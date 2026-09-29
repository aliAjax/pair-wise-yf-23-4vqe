import type { ShowSnapshot } from "../types/ShowSnapshot";
import { TIMELINE_CONSTANTS } from "../constants/appConfig";

/**
 * 首次打开（本地无数据）时的演示编排：
 * 6 台灯 DMX 通道互不压道，3 个场景，时间轴上有意安排了同图层重叠用于演示拦截。
 */
export function buildSeedData(): ShowSnapshot {
  const now = new Date().toISOString();
  return {
    version: 1,
    saved_at: now,
    project: {
      id: 1,
      title: "联排 · 第一幕",
      venue_name: "一号排练厅",
      fixture_ids: [1, 2, 3, 4, 5, 6],
      track_ids: [1, 2, 3, 4],
      updated_at: now
    },
    fixtures: [
      { id: 1, fixture_code: "PAR-L-01", fixture_type: "PAR", position_x: 14, position_y: 22, dmx_address: 1, channel_count: 3, color_mode: "RGB" },
      { id: 2, fixture_code: "PAR-R-01", fixture_type: "PAR", position_x: 86, position_y: 22, dmx_address: 4, channel_count: 3, color_mode: "RGB" },
      { id: 3, fixture_code: "WASH-C-01", fixture_type: "WASH", position_x: 30, position_y: 12, dmx_address: 7, channel_count: 4, color_mode: "RGBW" },
      { id: 4, fixture_code: "WASH-C-02", fixture_type: "WASH", position_x: 70, position_y: 12, dmx_address: 11, channel_count: 4, color_mode: "RGBW" },
      { id: 5, fixture_code: "BEAM-M-01", fixture_type: "BEAM", position_x: 50, position_y: 8, dmx_address: 21, channel_count: 7, color_mode: "MOVING_HEAD" },
      { id: 6, fixture_code: "DIM-CYC-01", fixture_type: "STROBE", position_x: 50, position_y: 78, dmx_address: 28, channel_count: 1, color_mode: "DIMMER_ONLY" }
    ],
    cues: [
      {
        id: 1,
        name: "开场暖场",
        fixture_states: [
          { fixture_id: 1, color: "#ffb347", brightness: 55 },
          { fixture_id: 2, color: "#ffb347", brightness: 55 },
          { fixture_id: 3, color: "#ff8c2e", brightness: 40 },
          { fixture_id: 4, color: "#ff8c2e", brightness: 40 }
        ],
        fade_in_ms: 3000,
        hold_ms: 5000,
        priority: 10,
        scene_status: "READY"
      },
      {
        id: 2,
        name: "主唱蓝调",
        fixture_states: [
          { fixture_id: 3, color: "#2e6bff", brightness: 80 },
          { fixture_id: 4, color: "#2e6bff", brightness: 80 },
          { fixture_id: 5, color: "#7fd0ff", brightness: 95, target_x: 50, target_y: 55 }
        ],
        fade_in_ms: 1500,
        hold_ms: 6000,
        priority: 30,
        scene_status: "READY"
      },
      {
        id: 3,
        name: "高潮频闪",
        fixture_states: [
          { fixture_id: 5, color: "#ffffff", brightness: 100, target_x: 20, target_y: 70 },
          { fixture_id: 6, color: "#ffffff", brightness: 100 },
          { fixture_id: 1, color: "#ff2e4d", brightness: 90 },
          { fixture_id: 2, color: "#ff2e4d", brightness: 90 }
        ],
        fade_in_ms: 200,
        hold_ms: 2500,
        priority: 50,
        scene_status: "DRAFT"
      }
    ],
    tracks: [
      { id: 1, cue_scene_id: 1, start_ms: 0, duration_ms: 8000, layer: 1, locked: false },
      { id: 2, cue_scene_id: 2, start_ms: 6000, duration_ms: 7000, layer: 1, locked: false },
      { id: 3, cue_scene_id: 3, start_ms: 12000, duration_ms: 3000, layer: 2, locked: false },
      { id: 4, cue_scene_id: 2, start_ms: 15000, duration_ms: 5000, layer: 2, locked: false }
    ],
    timeline_meta: {
      layer_count: TIMELINE_CONSTANTS.DEFAULT_LAYER_COUNT,
      locks: { 1: false, 2: false, 3: false, 4: false }
    }
  };
}
