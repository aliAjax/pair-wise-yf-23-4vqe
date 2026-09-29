/**
 * 全局常量（分散配置的一环：.env.example / docker-compose.yml / vite 环境变量 / 本文件）。
 * 时间轴默认值、图层数、预览刷新率等页面与 hooks 共同依赖。
 */
export const TIMELINE_CONSTANTS = {
  PX_PER_SECOND: 60,
  DEFAULT_LAYER_COUNT: 4,
  MIN_TRACK_DURATION_MS: 500,
  DEFAULT_TRACK_DURATION_MS: 4000,
  SNAP_GRID_MS: 500,
  MAX_SCENE_PRIORITY: 100,
  PLAYBACK_FRAME_MS: 50
} as const;

export const STORAGE_CONSTANTS = {
  LS_KEY: "stage-light:show:v1",
  IDB_NAME: "stage-light",
  IDB_VERSION: 1,
  IDB_STORE: "kv",
  IDB_KEY: "show-v1"
} as const;
