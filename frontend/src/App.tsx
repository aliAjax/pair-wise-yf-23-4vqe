import { useState } from "react";
import { routes } from "./router/routes";
import { useHashRoute } from "./router/useHashRoute";
import { useIndexedDbStore } from "./hooks/useIndexedDbStore";
import { useRepository } from "./stores/repository";
import { useShowProjectStore } from "./stores/ShowProjectStore";
import { useUiStore } from "./stores/UiStore";
import { FixturesPage } from "./pages/FixturesPage";
import { CuesPage } from "./pages/CuesPage";
import { TimelinePage } from "./pages/TimelinePage";
import { PreviewPage } from "./pages/PreviewPage";
import { formatDate } from "./utils/formatters";

export function App() {
  const [route, navigate] = useHashRoute();
  const { loading, source } = useIndexedDbStore();
  const project = useRepository((state) => state.project);
  const resetToSeed = useRepository((state) => state.resetToSeed);
  const updateProject = useShowProjectStore((state) => state.update);
  const exportJson = useShowProjectStore((state) => state.exportJson);
  const importJson = useShowProjectStore((state) => state.importJson);
  const toasts = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);
  const logs = useUiStore((state) => state.logs);
  const pushToast = useUiStore((state) => state.pushToast);
  const [editingMeta, setEditingMeta] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [venue, setVenue] = useState(project.venue_name);

  const onExport = async () => {
    const json = await exportJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.title.replace(/[\\/:*?"<>|\s]+/g, "_")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast("success", "演出方案已导出为 JSON");
  };

  const onImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await importJson(String(reader.result));
        pushToast("success", "演出方案已导入并覆盖本地数据");
      } catch (error) {
        pushToast("error", (error as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const saveMeta = async () => {
    await updateProject({ title: title.trim() || project.title, venue_name: venue });
    setEditingMeta(false);
    pushToast("success", "方案信息已保存");
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">◈</span>
          <div>
            <strong>舞台灯光</strong>
            <em>彩排编排器</em>
          </div>
        </div>
        <nav>
          {routes.map((item) => (
            <button
              key={item.route}
              type="button"
              className={route.route === item.route ? "active" : ""}
              onClick={() => navigate(item.route)}
            >
              <strong>{item.name}</strong>
              <em>{item.description}</em>
            </button>
          ))}
        </nav>

        <div className="sidebar-project">
          {editingMeta ? (
            <div className="project-form">
              <label><span>方案名</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label><span>场地</span>
                <input value={venue} onChange={(event) => setVenue(event.target.value)} />
              </label>
              <div className="project-form-actions">
                <button type="button" className="btn btn-small" onClick={() => setEditingMeta(false)}>取消</button>
                <button type="button" className="btn btn-small btn-primary" onClick={() => void saveMeta()}>保存</button>
              </div>
            </div>
          ) : (
            <>
              <strong className="project-title" title={project.title}>{project.title}</strong>
              <span className="project-venue">📍 {project.venue_name}</span>
              <button type="button" className="btn btn-small" onClick={() => { setTitle(project.title); setVenue(project.venue_name); setEditingMeta(true); }}>
                编辑方案信息
              </button>
            </>
          )}
          <div className="project-actions">
            <button type="button" className="btn btn-small" onClick={() => void onExport()}>导出 JSON</button>
            <label className="btn btn-small file-btn">
              导入 JSON
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImportFile(file);
                  event.target.value = "";
                }}
              />
            </label>
            <button type="button" className="btn btn-small btn-danger"
              onClick={() => {
                if (window.confirm("恢复为内置演示编排？当前本地数据将被覆盖。")) {
                  resetToSeed();
                  pushToast("info", "已恢复演示数据");
                }
              }}>
              重置演示
            </button>
          </div>
          <p className="project-saved">
            {loading ? "正在读取本地数据…" : `本地${source === "seed" ? "演示数据" : "已恢复"} · 保存于 ${formatDate(project.updated_at)}`}
          </p>
        </div>

        <div className="sidebar-logs">
          <h3>操作日志</h3>
          {logs.length === 0 ? <p className="muted">写操作（增删改、拦截、导入导出）会记录在这里。</p> : (
            <ul>
              {logs.slice(0, 12).map((log) => (
                <li key={log.id}>
                  <em>{formatDate(log.time)}</em>
                  <span>{log.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <main className="page">
        <header className="page-head">
          <div>
            <p className="eyebrow">stage-light · {project.venue_name}</p>
            <h1>{route.name}</h1>
          </div>
          <span className={"save-flag " + (loading ? "is-loading" : "is-saved")}>
            {loading ? "读取中" : "● 已本地保存"}
          </span>
        </header>

        {route.route === "/fixtures" ? <FixturesPage /> : null}
        {route.route === "/cues" ? <CuesPage /> : null}
        {route.route === "/timeline" ? <TimelinePage /> : null}
        {route.route === "/preview" ? <PreviewPage /> : null}
      </main>

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={"toast toast-" + toast.kind} onClick={() => dismissToast(toast.id)}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
