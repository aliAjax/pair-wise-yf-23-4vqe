import { useMemo } from "react";
import { rootStore } from "./redux/store";
import { uiApi } from "./redux/store";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { uiActions, type ToastItem, type LogEntry } from "./redux/uiSlice";

/**
 * UI store 外观：底层已迁移到 Redux Toolkit（stores/redux/uiSlice），
 * 页面仍通过 useUiStore(selector) 取 toast/日志与动作；
 * service 层在组件外直接使用 uiApi。actions 引用保持稳定。
 */
export interface UiFacade {
  toasts: ToastItem[];
  logs: LogEntry[];
  pushToast: (kind: ToastItem["kind"], message: string) => void;
  dismissToast: (id: number) => void;
  pushLog: (entity: string, message: string) => void;
}

export interface UiStoreHook {
  <T>(selector: (facade: UiFacade) => T): T;
  getState(): UiFacade;
}

export const useUiStore: UiStoreHook = function useUiStore<T>(selector: (facade: UiFacade) => T): T {
  const toasts = useAppSelector((state) => state.ui.toasts);
  const logs = useAppSelector((state) => state.ui.logs);
  const dispatch = useAppDispatch();
  const actions = useMemo(
    () => ({
      pushToast: (kind: ToastItem["kind"], message: string) => uiApi.pushToast(kind, message),
      dismissToast: (id: number) => dispatch(uiActions.toastDismissed(id)),
      pushLog: (entity: string, message: string) => uiApi.pushLog(entity, message)
    }),
    [dispatch]
  );
  const facade = useMemo<UiFacade>(() => ({ toasts, logs, ...actions }), [toasts, logs, actions]);
  return selector(facade);
};

useUiStore.getState = (): UiFacade => {
  const { toasts, logs } = rootStore.getState().ui;
  return {
    toasts,
    logs,
    pushToast: (kind, message) => uiApi.pushToast(kind, message),
    dismissToast: (id) => rootStore.dispatch(uiActions.toastDismissed(id)),
    pushLog: (entity, message) => uiApi.pushLog(entity, message)
  };
};
