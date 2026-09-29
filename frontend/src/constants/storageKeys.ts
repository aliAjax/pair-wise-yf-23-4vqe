/** IndexedDB 库名 / 对象仓库名 / 版本，db、api 与 store 均从此读取 */
export const DB_NAME = "stage-light";
export const DB_VERSION = 1;

export const STORE_KEYS = {
  fixture: "fixture",
  cueScene: "cueScene",
  timelineTrack: "timelineTrack",
  showProject: "showProject",
  log: "log"
} as const;

export const SEEDED_FLAG = "stage-light.seeded.v1";
