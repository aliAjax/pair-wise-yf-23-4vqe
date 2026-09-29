import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routes } from "./router/routes";
import { ToastHost } from "./components/common/ToastHost";
import { useIndexedDbStore } from "./hooks/useIndexedDbStore";
import "./styles.css";

const router = createBrowserRouter(routes);

function Bootstrap() {
  const { ready, error, reload } = useIndexedDbStore();

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-300">本地数据加载失败：{error}</p>
        <button className="btn-primary" onClick={() => void reload()}>
          重新加载
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-edge border-t-accent" />
        <p className="text-sm">正在从 IndexedDB 恢复编排数据…</p>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <ToastHost />
    </>
  );
}

export function App() {
  return <Bootstrap />;
}
