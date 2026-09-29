import { ERROR_CODES } from "./errorCodes";
import type { ErrorCode } from "./errorCodes";

/**
 * 错误消息模板（与错误码分离存放）。
 * 带参数的模板由 service 调用 formatErrorMessage 填充。
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.VALIDATION_FAILED]: "表单字段缺失或格式错误：{field}",
  [ERROR_CODES.DMX_ADDRESS_CONFLICT]: "DMX 地址 {address} 与灯具 {code} 的通道区间 {range} 冲突",
  [ERROR_CODES.DMX_ADDRESS_OUT_OF_RANGE]: "DMX 地址超出 1-512 通道范围（当前 {address}，需要 {count} 个通道）",
  [ERROR_CODES.FIXTURE_CODE_DUPLICATED]: "灯具编号 {code} 已存在",
  [ERROR_CODES.CUE_NOT_FOUND]: "场景 #{id} 不存在或已被删除",
  [ERROR_CODES.FIXTURE_NOT_FOUND]: "灯具 #{id} 不存在或已被删除",
  [ERROR_CODES.TIMELINE_OVERLAP]: "图层 {layer} 上 {start}-{end} 区间与「{cue}」重叠，已被挡住",
  [ERROR_CODES.TRACK_LOCKED]: "图层 {layer} 已锁定，请先解锁再操作",
  [ERROR_CODES.TRACK_NOT_FOUND]: "轨道块 #{id} 不存在",
  [ERROR_CODES.PERSISTENCE_FAILED]: "本地数据写入失败：{reason}",
  [ERROR_CODES.IMPORT_INVALID]: "导入文件不是有效的演出方案 JSON：{reason}"
};

export function formatErrorMessage(code: ErrorCode, params: Record<string, string | number> = {}): string {
  return ERROR_MESSAGES[code].replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}
