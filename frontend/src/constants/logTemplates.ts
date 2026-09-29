import type { OperationAction, OperationEntity } from "../types/OperationLog";

/**
 * 写操作日志模板（每个实体 ≥ 4 条）。
 * {name} 占位符由 logger.renderLog 填充；字段变更时必须同步改这里和调用处。
 */
export const LOG_TEMPLATES: Record<OperationEntity, Partial<Record<OperationAction, string>>> = {
  Fixture: {
    CREATE: "灯具创建：新增灯具 {name}",
    UPDATE: "灯具更新：修改灯具 {name} 的属性",
    DELETE: "灯具删除：移除灯具 {name}",
    EXPORT: "灯具导出：导出灯具清单（{name}）",
    IMPORT: "灯具导入：批量导入灯具（{name}）"
  },
  CueScene: {
    CREATE: "场景创建：新增场景 {name}",
    UPDATE: "场景更新：修改场景 {name} 的颜色/亮度/淡入时间",
    STATUS: "场景状态变更：场景 {name} 切换为 {detail}",
    DELETE: "场景删除：移除场景 {name}",
    EXPORT: "场景导出：导出场景数据（{name}）"
  },
  TimelineTrack: {
    CREATE: "轨道片段创建：在时间轴加入 {name}",
    UPDATE: "轨道片段更新：调整 {name} 的时刻/时长/层级",
    STATUS: "轨道锁定变更：{name} 已{detail}",
    DELETE: "轨道片段删除：移除 {name}",
    IMPORT: "轨道导入：批量导入时间轴片段（{name}）"
  },
  ShowProject: {
    CREATE: "演出方案创建：新建方案 {name}",
    UPDATE: "演出方案更新：保存方案 {name}",
    DELETE: "演出方案删除：移除方案 {name}",
    EXPORT: "演出方案导出：导出完整方案 {name}",
    IMPORT: "演出方案导入：导入方案 {name}"
  }
};
