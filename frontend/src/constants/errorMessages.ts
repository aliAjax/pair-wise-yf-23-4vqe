import { ERROR_CODES } from "./errorCodes";

/** {field} 等占位符由 utils/errors.formatMessage 填充 */
export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  VALIDATION_FAILED: "表单字段缺失或格式错误：{field}",
  DMX_ADDRESS_OVERLAP: "DMX 地址 {start} 与已有灯具 {name} 的通道 {begin}-{end} 冲突",
  DMX_ADDRESS_OUT_OF_RANGE: "DMX 地址超出 1-512 范围：灯具 {name} 需要 {count} 个通道",
  TRACK_OVERLAP: "第 {layer} 层时间重叠：与片段 {name}（{begin}-{end}）冲突",
  TRACK_LAYER_LOCKED: "第 {layer} 层轨道已锁定，无法改动片段 {name}",
  CUE_NOT_FOUND: "未找到场景：{name}",
  FIXTURE_NOT_FOUND: "未找到灯具：{name}",
  STORAGE_UNAVAILABLE: "本地存储不可用，数据无法保存：{field}",
  IMPORT_PAYLOAD_INVALID: "导入文件格式不正确：{field}"
};
