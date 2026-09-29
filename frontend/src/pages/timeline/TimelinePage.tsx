import { useMemo, useState } from "react";
import { useTimelineTrackStore } from "../../stores/TimelineTrackStore";
import { useCueSceneStore } from "../../stores/CueSceneStore";
import { useFixtureStore } from "../../stores/FixtureStore";
import { useShowProjectStore } from "../../stores/ShowProjectStore";
import { useUiStore, withToast } from "../../stores/UiStore";
import { useTimelinePlayback } from "../../hooks/useTimelinePlayback";
import { TimelineRuler } from "../../components/common/TimelineRuler";
import { PlaybackControls } from "../../components/common/PlaybackControls";
import { StatCard } from "../../components/common/StatCard";
import { EmptyState } from "../../components/common/EmptyState";
import { TIMELINE_DEFAULT_MS, TIMELINE_STEP_MS, TIMELINE_MIN_DURATION_MS } from "../../constants/playback";
import { getTimelineEnd } from "../../utils/playback";
import { isLayerLocked, snapTime } from "../../utils/timeline";
import { formatTimecode } from "../../utils/formatters";
import type { TimelineTrack } from "../../types/TimelineTrack";
import type { CueScene } from "../../types/CueScene";
import { TimelineBlock } from "./TimelineBlock";
import { TrackComposer } from "./TrackComposer";

const LAYER_HEIGHT = 56;

export function TimelinePage() {
  const tracks = useTimelineTrackStore((state) => state.rows);
  const scenes = useCueSceneStore((state) => state.rows);
  const fixtures = useFixtureStore((state) => state.rows);
  const updateTrack = useTimelineTrackStore((state) => state.update);
  const setLocked = useTimelineTrackStore((state) => state.setLocked);
  const removeTrack = useTimelineTrackStore((state) => state.remove);
  const createTrack = useTimelineTrackStore((state) => state.create);
  const activeProjectId = useShowProjectStore((state) => state.activeId);
  const projectRows = useShowProjectStore((state) => state.rows);
  const activeProject = projectRows.find((project) => project.id === activeProjectId) ?? projectRows[0] ?? undefined;
  const saveProject = useShowProjectStore((state) => state.save);
  const pushToast = useUiStore((state) => state.pushToast);

  const scenesById = useMemo(() => new Map(scenes.map((scene) => [scene.id, scene])), [scenes]);
  const usableScenes = scenes.filter((scene) => scene.scene_status !== "ARCHIVED");

  const durationMs = useMemo(
    () => Math.max(TIMELINE_DEFAULT_MS, getTimelineEnd(tracks, TIMELINE_DEFAULT_MS)),
    [tracks]
  );
  const layers = useMemo(() => {
    const values = new Set<number>([1, 2, 3]);
    tracks.forEach((track) => values.add(track.layer));
    return Array.from(values).sort((a, b) => a - b);
  }, [tracks]);

  const playback = useTimelinePlayback({ fixtures, tracks, scenes, durationMs });

  async function persistTrack(next: TimelineTrack) {
    try {
      await updateTrack(next, scenesById.get(next.cue_scene_id));
      pushToast("片段已更新", "success");
    } catch (error) {
      // toast 已由 ControllerError 消息承载；继续抛出供拖拽块回退位置
      pushToast((error as Error).message, "error");
      throw error;
    }
  }

  async function handleDropScene(cueId: string, layer: number, startRatio: number) {
    const scene = scenesById.get(cueId);
    if (!scene) {
      pushToast("场景不存在，无法加入时间轴", "error");
      return;
    }
    const start = snapTime(startRatio * durationMs, TIMELINE_STEP_MS);
    const duration = scene.hold_ms > 0 ? scene.hold_ms : Math.max(TIMELINE_MIN_DURATION_MS, 5000);
    await withToast(
      async () => {
        const created = await createTrack(
          { cue_scene_id: cueId, start_ms: start, duration_ms: duration, layer, locked: false },
          scene
        );
        if (activeProject) {
          await saveProject({ ...activeProject, track_ids: [...tracks.map((track) => track.id), created.id] });
        }
      },
      `已将「${scene.name}」放到第 ${layer} 层`,
      pushToast
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="片段数" value={tracks.length} />
        <StatCard label="轨道层" value={layers.length} />
        <StatCard label="时间轴长度" value={formatTimecode(durationMs)} />
        <StatCard
          label="锁定层"
          value={layers.filter((layer) => isLayerLocked(layer, tracks)).length}
          hint="锁层上的片段不可拖动"
        />
      </div>

      <PlaybackControls
        timeMs={playback.timeMs}
        durationMs={durationMs}
        playing={playback.playing}
        speed={playback.speed}
        onToggle={playback.toggle}
        onStop={playback.stop}
        onSeek={playback.seek}
        onSpeedChange={playback.setSpeed}
      />

      <div className="flex gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <TimelineRuler durationMs={durationMs} currentMs={playback.timeMs} tickMs={5000} height={26} />

          <div className="overflow-hidden rounded-xl border border-edge bg-panel">
            {layers.map((layer) => {
              const locked = isLayerLocked(layer, tracks);
              const layerTracks = tracks.filter((track) => track.layer === layer);
              return (
                <div key={layer} className="flex border-b border-edge last:border-b-0">
                  <div className={`flex w-28 shrink-0 flex-col justify-center gap-1 border-r border-edge px-3 ${locked ? "bg-red-950/30" : "bg-panel2"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">第 {layer} 层</span>
                      <button
                        type="button"
                        title={locked ? "解锁该层" : "锁定该层"}
                        onClick={() =>
                          void withToast(
                            async () => {
                              await Promise.all(layerTracks.map((track) => setLocked(track, !locked)));
                            },
                            locked ? `第 ${layer} 层已解锁` : `第 ${layer} 层已锁定`,
                            pushToast
                          )
                        }
                        className={`rounded px-1.5 py-0.5 text-xs ${locked ? "bg-red-500/20 text-red-300" : "text-slate-400 hover:text-slate-200"}`}
                      >
                        {locked ? "🔒" : "🔓"}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500">{locked ? "已锁定，同层挡片段" : "同层重叠将被阻止"}</span>
                  </div>
                  <TimelineLane
                    key={layer}
                    layer={layer}
                    locked={locked}
                    tracks={layerTracks}
                    durationMs={durationMs}
                    laneHeight={LAYER_HEIGHT}
                    currentMs={playback.timeMs}
                    onDropScene={handleDropScene}
                    renderBlock={(track) => (
                      <TimelineBlock
                        key={track.id}
                        track={track}
                        scene={scenesById.get(track.cue_scene_id)}
                        durationMs={durationMs}
                        laneHeight={LAYER_HEIGHT}
                        active={playback.activeCues.some((cue) => cue.track.id === track.id)}
                        locked={locked}
                        onChange={(next) => void persistTrack(next)}
                        onRemove={() =>
                          void withToast(
                            async () => {
                              await removeTrack(track);
                              if (activeProject) {
                                await saveProject({
                                  ...activeProject,
                                  track_ids: activeProject.track_ids.filter((id) => id !== track.id)
                                });
                              }
                            },
                            "片段已删除",
                            pushToast
                          )
                        }
                      />
                    )}
                  />
                </div>
              );
            })}
          </div>

          {tracks.length === 0 && (
            <EmptyState title="时间轴还是空的" hint="把右侧场景卡片拖到任意一层轨道上即可安排演出顺序。" />
          )}

          <ActiveCueStrip cues={playback.activeCues.map((cue) => cue.scene)} />
        </div>

        <TrackComposer scenes={usableScenes} onAdd={(cueId, layer, startMs) => void handleDropScene(cueId, layer, startMs / durationMs)} />
      </div>
    </div>
  );
}

function TimelineLane({
  layer,
  locked,
  tracks,
  durationMs,
  laneHeight,
  currentMs,
  onDropScene,
  renderBlock
}: {
  layer: number;
  locked: boolean;
  tracks: TimelineTrack[];
  durationMs: number;
  laneHeight: number;
  currentMs: number;
  onDropScene: (cueId: string, layer: number, ratio: number) => void;
  renderBlock: (track: TimelineTrack) => React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      data-lane
      className={`relative flex-1 ${dragOver ? "bg-accent/5" : ""} ${locked ? "bg-red-950/10" : ""}`}
      style={{ height: laneHeight }}
      onDragOver={(event) => {
        if (locked) return;
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        setDragOver(false);
        if (locked) return;
        const cueId = event.dataTransfer.getData("text/cue-id");
        if (!cueId) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;
        onDropScene(cueId, layer, Math.max(0, Math.min(1, ratio)));
      }}
    >
      {/* 网格竖线 */}
      {Array.from({ length: 11 }, (_, index) => index + 1).map((index) => (
        <span key={index} className="absolute top-0 h-full w-px bg-edge/50" style={{ left: `${index * 10}%` }} />
      ))}
      {/* 播放头 */}
      <span className="absolute top-0 z-20 h-full w-0.5 bg-accent/70" style={{ left: `${(currentMs / durationMs) * 100}%` }} />
      {tracks.map(renderBlock)}
      {tracks.length === 0 && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-slate-600">
          {locked ? "该层已锁定" : "拖场景到这里"}
        </span>
      )}
    </div>
  );
}

function ActiveCueStrip({ cues }: { cues: CueScene[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-panel p-3 text-xs">
      <span className="text-slate-500">当前时刻激活场景（高优先级在上）：</span>
      {cues.length === 0 && <span className="text-slate-600">黑场</span>}
      {cues.map((cue) => (
        <span key={cue.id} className="rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-accent">
          P{cue.priority} {cue.name}
        </span>
      ))}
    </div>
  );
}
