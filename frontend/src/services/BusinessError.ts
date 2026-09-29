import { ERROR_CODES } from "../constants/errorCodes";
import type { ErrorCode } from "../constants/errorCodes";

/** 业务异常：service 层抛出，api 层做二次包装，页面 toast 消费 */
export class BusinessError extends Error {
  readonly code: ErrorCode;
  readonly params: Record<string, string | number>;

  constructor(code: ErrorCode, message: string, params: Record<string, string | number> = {}) {
    super(message);
    this.name = "BusinessError";
    this.code = code;
    this.params = params;
  }

  static create(code: ErrorCode, params?: Record<string, string | number>): BusinessError {
    return new BusinessError(code, ERROR_CODES[code], params);
  }
}
