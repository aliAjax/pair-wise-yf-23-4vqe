import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navEntries } from "../../router/routes";
import { useShowProjectStore } from "../../stores/ShowProjectStore";
import { useUiStore } from "../../stores/UiStore";
import { withToast } from "../../stores/UiStore";
import * as projectService from "../../services/ShowProjectService";
import { listLogs, clearBusinessStores } from "../../api/ShowProject";
import { saveFixtureMany, saveCueSceneMany, saveTimelineTrackMany } from "../../api";
import { seedData } from "../../mocks/seedData";
import { Modal } from "../common/Modal";
import type { OperationLog } from "../../types/OperationLog";
import { readJsonFile } from "../../utils/backup";
import { formatDate } from "../../utils/formatters";
import { useFixtureStore } from "../../stores/FixtureStore";
import { useCueSceneStore } from "../../stores/CueSceneStore";
import { useTimelineTrackStore } from "../../stores/TimelineTrackStore";
import { writeLog } from "../../utils/logger";

export function AppShell({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const projects = useShowProjectStore((state) => state.rows);
  const activeId = useShowProjectStore((state) => state.activeId);
  const active = projects.find((project) => project.id === activeId) ?? projects[0] ?? undefined;
  const setActive = useShowProjectStore((state) => state.setActive);
  const saveProject = useShowProjectStore((state) => state.save);
  const pushToast = useUiStore((state) => state.pushToast);

  const fixtures = useFixtureStore((state) => state.rows);
  const cueScenes = useCueSceneStore((state) => state.rows);
  const tracks = useTimelineTrackStore((state) => state.rows);
  const replaceFixtures = useFixtureStore((state) => state.replaceAll);
  const replaceCues = useCueSceneStore((state) => state.replaceAll);
  const replaceTracks = useTimelineTrackStore((state) => state.replaceAll);
  const replaceProjects = useShowProjectStore((state) => state.replaceAll);

  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  const current = navEntries.find((entry) => entry.route === location.pathname);

  async function handleExport() {
    if (!active) {
      pushToast("还没有可导出的方案", "error");
      return;
    }
    await withToast(
      () => projectService.exportBackup(active, fixtures, cueScenes, tracks),
      "方案已导出为 JSON",
      pushToast
    );
  }

  async function handleImportFile(file: File) {
    await withToast(
      async () => {
        const data = projectService.parseBackup(await readJsonFile(file));
        await clearBusinessStores();
        await saveFixtureMany(data.fixtures);
        await saveCueSceneMany(data.cueScenes);
        await saveTimelineTrackMany(data.tracks);
        replaceFixtures(data.fixtures);
        replaceCues(data.cueScenes);
        replaceTracks(data.tracks);
        replaceProjects(data.projects.length ? data.projects : []);
        await writeLog("ShowProject", "IMPORT", { name: file.name });
        setImportOpen(false);
      },
      "方案导入完成",
      pushToast
    );
  }

  async function handleResetSeed() {
    await withToast(
      async () => {
        await clearBusinessStores();
        await saveFixtureMany(seedData.fixture);
        await saveCueSceneMany(seedData.cueScene);
        await saveTimelineTrackMany(seedData.timelineTrack);
        replaceFixtures(seedData.fixture);
        replaceCues(seedData.cueScene);
        replaceTracks(seedData.timelineTrack);
        replaceProjects(seedData.showProject);
      },
      "已恢复到内置彩排种子数据",
      pushToast
    );
  }

  async function openLogs() {
    setLogsOpen(true);
    setLogs((await listLogs()).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 200));
  }

  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r border-edge bg-panel">
        <div className="border-b border-edge px-5 py-4">
          <p className="text-base font-bold text-slate-100">舞台灯光编排</p>
          <p className="text-[11px] tracking-widest text-slate-500">STAGE-LIGHT REHEARSAL</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navEntries.map((entry) => (
            <NavLink
              key={entry.route}
              to={entry.route}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-colors ${
                  isActive ? "bg-accent/15 text-accent" : "text-slate-400 hover:bg-panel2 hover:text-slate-200"
                }`
              }
            >
              <span className="mr-2">{entry.icon}</span>
              <span className="text-sm font-medium">{entry.name}</span>
              <span className="mt-0.5 block pl-6 text-[11px] text-slate-600">{entry.description}</span>
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-edge p-3 text-[11px] text-slate-500">
          <button className="btn w-full justify-center" onClick={openLogs}>
            📜 操作日志
          </button>
          <button className="btn w-full justify-center" onClick={() => setImportOpen(true)}>
            ⬆ 导入方案
          </button>
          <button className="btn w-full justify-center" onClick={handleResetSeed}>
            ↺ 恢复示例
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-edge bg-panel px-6 py-3">
          <div>
            <h1 className="text-lg font-bold text-slate-100">{current?.name ?? "灯具布置"}</h1>
            <p className="text-xs text-slate-500">{current?.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <ProjectSwitcher
              projects={projects}
              activeId={active?.id ?? null}
              onSelect={setActive}
              onSave={() => active && void withToast(() => saveProject(active), "方案已保存", pushToast)}
            />
            <button className="btn" onClick={handleExport}>
              ⬇ 导出方案
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children ?? <Outlet />}</main>
      </div>

      <Modal open={logsOpen} title="操作日志（写操作均记录，存 IndexedDB）" onClose={() => setLogsOpen(false)}>
        <ul className="space-y-1 font-mono text-xs">
          {logs.length === 0 && <p className="text-slate-500">暂无写操作日志</p>}
          {logs.map((log) => (
            <li key={log.id} className="flex gap-2 rounded bg-panel2 px-2 py-1">
              <span className="text-slate-500">{formatDate(log.created_at)}</span>
              <span className="text-accent">[{log.entity}]</span>
              <span className="text-slate-300">{log.message}</span>
            </li>
          ))}
        </ul>
      </Modal>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onFile={handleImportFile} />
    </div>
  );
}

function ProjectSwitcher({
  projects,
  activeId,
  onSelect,
  onSave
}: {
  projects: { id: string; title: string; venue_name: string }[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={activeId ?? ""}
        onChange={(event) => onSelect(event.target.value)}
        className="!w-52"
        title="切换演出方案"
      >
        {projects.length === 0 && <option value="">（暂无方案）</option>}
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
            {project.venue_name ? ` · ${project.venue_name}` : ""}
          </option>
        ))}
      </select>
      <button className="btn" onClick={onSave} disabled={!activeId}>
        💾 保存方案
      </button>
    </div>
  );
}

function ImportModal({
  open,
  onClose,
  onFile
}: {
  open: boolean;
  onClose: () => void;
  onFile: (file: File) => void;
}) {
  return (
    <Modal open={open} title="导入演出方案 JSON" onClose={onClose}>
      <p className="mb-3 text-xs text-slate-400">
        导入会覆盖当前浏览器内的灯具、场景、轨道与方案数据（操作日志保留）。
      </p>
      <input
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
          event.currentTarget.value = "";
        }}
      />
    </Modal>
  );
}

