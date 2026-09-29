/**
 * 灯具类型枚举（类型侧定义）。
 * 出现位置：types/FixtureType、constants/FixtureType、constructors/FixtureConstructor、
 * mocks/seedData、utils/formatters、constants/logTemplates、constants/errorMessages、
 * stores/FixtureStore、components/common/FixtureIcon、pages/FixturesPage、pages/CuesPage。
 */
export const FixtureTypeValues = ["PAR", "SPOT", "WASH", "BEAM", "STROBE"] as const;
export type FixtureType = (typeof FixtureTypeValues)[number];
