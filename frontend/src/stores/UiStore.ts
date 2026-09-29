import { create } from "zustand";

export type ToastTone = "info" | "success" | "error";

export interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface UiState {
  toasts: ToastItem[];
  pushToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 0;

/** 全局轻提示：service/controller 抛出的异常最终在这里展示 */
export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  pushToast(message, tone = "info") {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts, { id, tone, message }] });
    window.setTimeout(() => get().dismissToast(id), 4200);
  },
  dismissToast(id) {
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
  }
}));

/** 页面里统一包一层：成功提示 / 失败弹错误 toast */
export async function withToast<T>(
  run: () => Promise<T>,
  successMessage?: string,
  pushToast?: (message: string, tone?: ToastTone) => void
): Promise<T | undefined> {
  try {
    const result = await run();
    if (successMessage && pushToast) pushToast(successMessage, "success");
    return result;
  } catch (error) {
    pushToast?.((error as Error).message, "error");
    return undefined;
  }
}
