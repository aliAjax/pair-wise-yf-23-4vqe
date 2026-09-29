/**
 * 演出方案 ShowProject —— 聚合灯具、场景与轨道的顶层容器。
 * 纯前端单文件应用只有一个方案实例，保存在本地，关闭页面后仍可继续编排。
 */
export interface ShowProject {
  id: number;
  title: string;
  venue_name: string;
  fixture_ids: number[];
  track_ids: number[];
  updated_at: string;
}
