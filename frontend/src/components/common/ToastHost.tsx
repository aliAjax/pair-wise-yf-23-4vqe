import { useUiStore } from "../../stores/UiStore";

/** 全局 Toast 容器 */
export function ToastHost() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className={`pointer-events-auto rounded-lg border px-3 py-2 text-left text-sm shadow-lg ${
            toast.tone === "error"
              ? "border-red-500/50 bg-red-950/90 text-red-200"
              : toast.tone === "success"
                ? "border-emerald-500/50 bg-emerald-950/90 text-emerald-200"
                : "border-edge bg-panel text-slate-200"
          }`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
