import { useMemo, useState } from "react";
import { useCueSceneStore } from "../../stores/CueSceneStore";
import { useFixtureStore } from "../../stores/FixtureStore";
import { useTimelineTrackStore } from "../../stores/TimelineTrackStore";
import { useShowProjectStore } from "../../stores/ShowProjectStore";
import { useUiStore, withToast } from "../../stores/UiStore";
import { CueCard } from "../../components/common/CueCard";
import { EmptyState } from "../../components/common/EmptyState";
import { StatCard } from "../../components/common/StatCard";
import { CUE_STATUSES, CueStatusText } from "../../constants/CueStatus";
import type { CueScene } from "../../types/CueScene";
import type { CueStatus } from "../../types/CueStatus";
import { SceneEditor } from "./SceneEditor";
import { SceneFormModal } from "./SceneFormModal";

type StatusFilter = CueStatus | "ALL";

export function CuesPage() {
  const scenes = useCueSceneStore((state) => state.rows);
  const fixtures = useFixtureStore((state) => state.rows);
  const create = useCueSceneStore((state) => state.create);
  const duplicate = useCueSceneStore((state) => state.duplicate);
  const remove = useCueSceneStore((state) => state.remove);
  const setStatus = useCueSceneStore((state) => state.setStatus);
  const removeByCue = useTimelineTrackStore((state) => state.removeByCue);
  const trackRows = useTimelineTrackStore((state) => state.rows);
  const activeProjectId = useShowProjectStore((state) => state.activeId);
  const projectRows = useShowProjectStore((state) => state.rows);
  const activeProject = projectRows.find((project) => project.id === activeProjectId) ?? projectRows[0];
  const saveProject = useShowProjectStore((state) => state.save);
  const pushToast = useUiStore((state) => state.pushToast);

  const [selectedId, setSelectedId] = useState<string | null>(scenes[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [keyword, setKeyword] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () =>
      scenes.filter(
        (scene) =>
          (statusFilter === "ALL" || scene.scene_status === statusFilter) &&
          scene.name.toLowerCase().includes(keyword.trim().toLowerCase())
      ),
    [scenes, statusFilter, keyword]
  );

  const selected = scenes.find((scene) => scene.id === selectedId) ?? null;

  async function handleDelete(scene: CueScene) {
    await withToast(
      async () => {
        const removedTrackIds = trackRows.filter((track) => track.cue_scene_id === scene.id).map((track) => track.id);
        await removeByCue(scene.id);
        await remove(scene);
        if (activeProject && removedTrackIds.length > 0) {
          await saveProject({
            ...activeProject,
            track_ids: activeProject.track_ids.filter((id) => !removedTrackIds.includes(id))
          });
        }
        if (selectedId === scene.id) setSelectedId(null);
      },
      `场景「${scene.name}」及其时间轴片段已删除`,
      pushToast
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="场景总数" value={scenes.length} />
        <StatCard label="就绪" value={scenes.filter((scene) => scene.scene_status === "READY").length} />
        <StatCard label="草稿/停用" value={scenes.filter((scene) => ["DRAFT", "DISABLED"].includes(scene.scene_status)).length} />
        <StatCard label="灯具数" value={fixtures.length} hint="场景可命中的灯具" />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="搜索场景名称…"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="!w-56"
        />
        <div className="flex gap-1">
          <FilterChip active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
            全部
          </FilterChip>
          {CUE_STATUSES.map((status) => (
            <FilterChip key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
              {CueStatusText[status]}
            </FilterChip>
          ))}
        </div>
        <button className="btn-primary ml-auto" onClick={() => setCreating(true)}>
          ＋ 新建场景
        </button>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-80 shrink-0 space-y-2">
          {filtered.length === 0 && (
            <EmptyState title="没有匹配的场景" hint="调整筛选条件，或新建一个场景。" />
          )}
          {filtered.map((scene) => (
            <CueCard
              key={scene.id}
              scene={scene}
              fixtures={fixtures}
              selected={selectedId === scene.id}
              onClick={() => setSelectedId(scene.id)}
              actions={
                <>
                  <select
                    value={scene.scene_status}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      void withToast(
                        () => setStatus(scene, event.target.value as CueStatus),
                        `场景状态已更新`,
                        pushToast
                      )
                    }
                    className="!w-24 !py-1 !text-xs"
                  >
                    {CUE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {CueStatusText[status]}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn" onClick={() => void duplicate(scene).then(() => pushToast("场景已复制", "success"))}>
                    复制
                  </button>
                  <button type="button" className="btn-danger" onClick={() => void handleDelete(scene)}>
                    删除
                  </button>
                </>
              }
            />
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {selected ? (
            <SceneEditor key={selected.id} scene={selected} fixtures={fixtures} />
          ) : (
            <EmptyState
              title="选择或新建一个场景"
              hint="在场景里为每台灯设置颜色、亮度与淡入时间，保存后可拖到时间轴上试演。"
            />
          )}
        </div>
      </div>

      {creating && (
        <SceneFormModal
          fixtures={fixtures}
          onClose={() => setCreating(false)}
          onSubmit={async (draft) => {
            const scene = await create(draft);
            setCreating(false);
            setSelectedId(scene.id);
            pushToast(`场景「${scene.name}」已创建`, "success");
          }}
        />
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs ${
        active ? "border-accent bg-accent/15 text-accent" : "border-edge text-slate-400 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

