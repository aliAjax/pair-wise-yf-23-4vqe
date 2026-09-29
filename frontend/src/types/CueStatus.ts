/**
 * 场景状态枚举（类型侧定义）。
 * 出现位置：types/CueStatus、constants/CueStatus、constructors/CueSceneConstructor、
 * mocks/seedData、utils/formatters、constants/logTemplates、constants/errorMessages、
 * stores/CueSceneStore、components/common/StatusBadge、components/common/CueCard、
 * pages/CuesPage、pages/TimelinePage。
 */
export const CueStatusValues = ["DRAFT", "READY", "DISABLED", "ARCHIVED"] as const;
export type CueStatus = (typeof CueStatusValues)[number];
