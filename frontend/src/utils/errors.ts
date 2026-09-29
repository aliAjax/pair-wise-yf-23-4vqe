import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { ErrorCode } from "../constants/errorCodes";

export type ErrorParams = Record<string, string | number>;

/** service 层抛出的业务异常 */
export class ServiceError extends Error {
  code: ErrorCode;
  params: ErrorParams;

  constructor(code: ErrorCode, params: ErrorParams = {}) {
    super(formatMessage(code, params));
    this.name = "ServiceError";
    this.code = code;
    this.params = params;
  }
}

export function formatMessage(code: ErrorCode, params: ErrorParams = {}): string {
  const template = ERROR_MESSAGES[code] ?? code;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] === undefined ? `{${key}}` : String(params[key])
  );
}

/** controller（store）层再包一层，区分服务失败与页面异常 */
export class ControllerError extends Error {
  causeCode: ErrorCode;

  constructor(cause: ServiceError | Error, context: string) {
    const code = cause instanceof ServiceError ? cause.code : ERROR_CODES.VALIDATION_FAILED;
    super(`${context}：${cause.message}`);
    this.name = "ControllerError";
    this.causeCode = code;
  }
}
