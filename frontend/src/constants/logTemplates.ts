/**
 * 操作日志模板集中存放：每个实体至少 4 条（创建 / 更新 / 删除 / 导出），
 * 所有写操作经 services 层 logger 记录到 uiStore.logs。
 * 字段变更时需要同步修改模板与 services/* 中的调用处。
 */
export const LOG_TEMPLATES = {
  Fixture: {
    create: "灯具创建：编号 {code}，类型 {type}，起始地址 {address}",
    update: "灯具更新：编号 {code}，变更字段 {fields}",
    remove: "灯具删除：编号 {code}，释放 DMX 通道 {range}",
    conflict: "DMX 冲突拦截：编号 {code} 地址 {address} 撞上 {other}"
  },
  CueScene: {
    create: "灯光场景创建：{name}，淡入 {fade}ms，优先级 {priority}",
    update: "灯光场景更新：{name}，变更字段 {fields}",
    remove: "灯光场景删除：{name}（含 {count} 台灯状态）",
    status: "灯光场景状态变更：{name}，{from} → {to}"
  },
  TimelineTrack: {
    create: "时间轴轨道创建：场景 {cue} 排到图层 {layer} @ {start}ms",
    update: "时间轴轨道更新：#{id}（场景 {cue}），变更字段 {fields}",
    remove: "时间轴轨道删除：#{id}（场景 {cue}）",
    overlap: "时间轴重叠拦截：图层 {layer} @ {start}ms 被 {cue} 挡住"
  },
  ShowProject: {
    create: "演出方案创建：{title} @ {venue}",
    update: "演出方案更新：{title}，变更字段 {fields}",
    export: "演出方案导出：{title}（灯具 {fixtures} / 场景 {cues} / 轨道 {tracks}）",
    import: "演出方案导入：{title}，覆盖本地数据"
  }
} as const;

export type LogEntity = keyof typeof LOG_TEMPLATES;

export function renderLog(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}
