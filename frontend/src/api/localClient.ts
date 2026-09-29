import { BusinessError } from "../services/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";
import { formatErrorMessage } from "../constants/errorMessages";

/** api 层统一包装：service 的 BusinessError 原样抛，其余异常包装成持久化/未知错误 */
export async function withLocalApi<T>(fn: () => T | Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof BusinessError) throw error;
    throw new BusinessError(
      ERROR_CODES.PERSISTENCE_FAILED,
      formatErrorMessage(ERROR_CODES.PERSISTENCE_FAILED, { reason: (error as Error).message }),
      { reason: (error as Error).message }
    );
  }
}

export const delay = (ms = 30) => new Promise((resolve) => window.setTimeout(resolve, ms));
