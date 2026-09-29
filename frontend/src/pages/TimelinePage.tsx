import { useMemo, useRef, useState } from "react";
import type { TimelineTrack } from "../types/TimelineTrack";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useFixtureStore } from "../stores/FixtureStore";
import { useUiStore } from "../stores/UiStore";
import { TIMELINE_CONSTANTS } from "../constants/appConfig";
import { PLAYABLE_CUE_STATUSES, CUE_STATUS_TEXT } from "../constants/CueStatus";
import { snapToGrid, trackEnd } from "../services/TimelineService";
import { useTimelinePlayback } from "../hooks/useTimelinePlayback";
import { TimelineRuler } from "../components/common/TimelineRuler";
import { StatusBadge } from "../components/common/StatusBadge";
import { EmptyState } from "../components/common/EmptyState";
import { formatClock, formatClockSeconds } from "../utils/formatters";

interface DragContext {
  trackId: number;
  startX: number;
  originStart: number;
  moved: boolean;
}

export function TimelinePage() {
  const tracks = useTimelineTrackStore((state) => state.rows);
  const meta = useTimelineTrackStore((state) => state.meta);
  const place = useTimelineTrackStore((state) => state.place);
  const update = useTimelineTrackStore((state) => state.update);
  const remove = useTimelineTrackStore((state) => state.remove);
  const setLayerLocked = useTimelineTrackStore((state) => state.setLayerLocked);
  const cues = useCueSceneStore((state) => state.rows);
  const fixtures = useFixtureStore((state) => state.rows);
  const pushToast = useUiStore((state) => state.pushToast);

  const playback = useTimelinePlayback(tracks);
  const laneRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const dragRef = useRef<DragContext | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<number | null>(null);
  const [ghostStart, setGhostStart] = useState<number | null>(null);

  const cueById = useMemo(() => new Map(cues.map((cue) => [cue.id, cue])), [cues]);
  const layers = Array.from({ length: meta.layer_count }, (_, index) => index + 1);
  const width = (playback.durationMs / 1000) * TIMELINE_CONSTANTS.PX_PER_SECOND;

  const paletteCues = cues.filter((cue) => PLAYABLE_CUE_STATUSES.includes(cue.scene_status));

  const timeFromEvent = (event: React.DragEvent | React.MouseEvent, layer: number): number => {
    const lane = laneRefs.current[layer];
    if (!lane) return 0;
    const rect = lane.getBoundingClientRect();
    return snapToGrid(((event.clientX - rect.left) / TIMELINE_CONSTANTS.PX_PER_SECOND) * 1000);
  };

  // 从场景库拖入：dataTransfer 带 cue id
  const onDropNew = async (event: React.DragEvent, layer: number) => {
    event.preventDefault();
    setDragOverLayer(null);
    const cueId = Number(event.dataTransfer.getData("text/cue-id"));
    if (!cueId) return;
    const start = timeFromEvent(event, layer);
    try {
      await place({ cue_scene_id: cueId, start_ms: start, layer });
      pushToast("success", `场景已排到图层 ${layer} @ ${formatClockSeconds(start)}`);
    } catch (error) {
      pushToast("error", (error as Error).message);
    }
  };

  const beginBlockDrag = (event: React.MouseEvent, track: TimelineTrack) => {
    if (meta.locks[track.layer]) return;
    event.preventDefault();
    const ctx: DragContext & { liveDeltaMs: number } = {
      trackId: track.id,
      startX: event.clientX,
      originStart: track.start_ms,
      moved: false,
      liveDeltaMs: 0
    };
    dragRef.current = ctx;

    const onMove = (moveEvent: MouseEvent) => {
      const deltaMs = ((moveEvent.clientX - ctx.startX) / TIMELINE_CONSTANTS.PX_PER_SECOND) * 1000;
      ctx.liveDeltaMs = deltaMs;
      if (Math.abs(moveEvent.clientX - ctx.startX) > 4) ctx.moved = true;
      setGhostStart(snapToGrid(ctx.originStart + deltaMs));
    };
    const onUp = async () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      dragRef.current = null;
      setGhostStart(null);
      if (!ctx.moved) return;
      const start = snapToGrid(ctx.originStart + ctx.liveDeltaMs);
      await applyMove(ctx.trackId, Math.max(0, start));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const applyMove = async (trackId: number, startMs: number) => {
    try {
      await update(trackId, { start_ms: startMs });
    } catch (error) {
      pushToast("error", (error as Error).message);
    }
  };

  const resizeEdge = async (event: React.MouseEvent, track: TimelineTrack) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const originDuration = track.duration_ms;
    const onMove = (moveEvent: MouseEvent) => {
      const next = Math.max(
        TIMELINE_CONSTANTS.MIN_TRACK_DURATION_MS,
        snapToGrid(originDuration + ((moveEvent.clientX - startX) / TIMELINE_CONSTANTS.PX_PER_SECOND) * 1000)
      );
      setResizeGhost({ id: track.id, duration: next });
    };
    const onUp = async () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const ghost = resizeGhostRef.current;
      setResizeGhost(null);
      if (ghost && ghost.duration !== originDuration) {
        try {
          await update(ghost.id, { duration_ms: ghost.duration });
        } catch (error) {
          pushToast("error", (error as Error).message);
        }
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const [resizeGhost, setResizeGhost] = useState<{ id: number; duration: number } | null>(null);
  const resizeGhostRef = useRef<typeof resizeGhost>(null);
  resizeGhostRef.current = resizeGhost;

  const toggleLock = async (layer: number) => {
    const next = !meta.locks[layer];
    await setLayerLocked(layer, next);
    pushToast(next ? "info" : "success", `图层 ${layer} 已${next ? "锁定" : "解锁"}`);
  };

  return (
    <div className="page-grid page-grid-timeline">
      <section className="panel panel-cue-palette">
        <div className="panel-head"><h2>场景库</h2></div>
        <p className="panel-sub">把可演出场景拖到右侧图层；同图层重叠会被挡住。</p>
        {paletteCues.length === 0 ? <EmptyState title="没有可演出场景" hint="到场景编辑页创建并设为可演出" /> : (
          <ul className="cue-palette">
            {paletteCues.map((cue) => (
              <li key={cue.id} draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/cue-id", String(cue.id));
                  event.dataTransfer.effectAllowed = "copy";
                }}
                className="cue-palette-item">
                <strong>{cue.name}</strong>
                <span>P{cue.priority} · 淡入 {formatClockSeconds(cue.fade_in_ms)} · {cue.fixture_states.length}/{fixtures.length} 灯</span>
              </li>
            ))}
          </ul>
        )}
        <div className="playback-mini">
          <button type="button" className="btn btn-small" onClick={playback.stop}>⏹</button>
          <button type="button" className="btn btn-small btn-primary" onClick={playback.toggle}>
            {playback.playing ? "⏸ 暂停" : "▶ 播放"}
          </button>
          <span className="playback-clock">{formatClock(playback.timeMs)} / {formatClock(playback.durationMs)}</span>
        </div>
      </section>

      <section className="panel panel-timeline">
        <div className="panel-head">
          <h2>时间轴图层</h2>
          <span className="panel-sub">图层锁定后不可排场景 / 拖动 / 删除</span>
        </div>
        <div className="timeline-scroll">
          <div className="timeline-inner" style={{ width }}>
            <div className="timeline-corner">
              <TimelineRuler durationMs={playback.durationMs} timeMs={playback.timeMs} onSeek={playback.seek} />
            </div>
            {layers.map((layer) => {
              const locked = Boolean(meta.locks[layer]);
              const laneTracks = tracks.filter((track) => track.layer === layer);
              return (
                <div key={layer} className={"timeline-lane-row" + (locked ? " is-locked" : "") + (dragOverLayer === layer ? " is-dragover" : "")}>
                  <div className="timeline-lane-label">
                    <strong>图层 {layer}</strong>
                    <button type="button" className={"btn btn-small " + (locked ? "btn-warn" : "")} onClick={() => void toggleLock(layer)}>
                      {locked ? "🔒 已锁定" : "🔓 未锁定"}
                    </button>
                  </div>
                  <div
                    ref={(node) => {
                      laneRefs.current[layer] = node;
                    }}
                    className="timeline-lane"
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverLayer(layer);
                    }}
                    onDragLeave={() => setDragOverLayer((value) => (value === layer ? null : value))}
                    onDrop={(event) => void onDropNew(event, layer)}
                  >
                    {laneTracks.map((track) => {
                      const cue = cueById.get(track.cue_scene_id);
                      const moving = dragRef.current?.trackId === track.id && ghostStart !== null;
                      const leftStart = moving && ghostStart !== null ? ghostStart : track.start_ms;
                      const duration = resizeGhost?.id === track.id ? resizeGhost.duration : track.duration_ms;
                      const activeNow = playback.timeMs >= track.start_ms && playback.timeMs < trackEnd(track);
                      return (
                        <div
                          key={track.id}
                          className={"timeline-block" + (activeNow ? " is-active" : "")}
                          style={{
                            left: (leftStart / 1000) * TIMELINE_CONSTANTS.PX_PER_SECOND,
                            width: (duration / 1000) * TIMELINE_CONSTANTS.PX_PER_SECOND,
                            opacity: moving ? 0.6 : 1
                          }}
                          onMouseDown={(event) => void beginBlockDrag(event, track)}
                          title={cue ? `${cue.name}（P${cue.priority}）${locked ? " · 图层锁定" : ""}` : "场景已删除"}
                        >
                          <span className="timeline-block-title">{cue?.name ?? `场景 #${track.cue_scene_id}`}</span>
                          <span className="timeline-block-time">{formatClockSeconds(track.start_ms)}–{formatClockSeconds(trackEnd(track))}</span>
                          {cue ? <StatusBadge value={cue.scene_status} /> : null}
                          {!locked ? (
                            <>
                              <span className="timeline-block-resize" onMouseDown={(event) => void resizeEdge(event, track)} />
                              <button type="button" className="timeline-block-delete"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (window.confirm("移除该轨道块？")) void remove(track.id).catch((error: Error) => pushToast("error", error.message));
                                }}>×</button>
                            </>
                          ) : <span className="timeline-block-lock">🔒</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="timeline-legend">
          <span><i className="legend-dot legend-ready" />{CUE_STATUS_TEXT.READY}</span>
          <span><i className="legend-dot legend-draft" />{CUE_STATUS_TEXT.DRAFT}</span>
          <span><i className="legend-dot legend-active" />播放中</span>
          <span>吸附网格 {TIMELINE_CONSTANTS.SNAP_GRID_MS}ms</span>
        </div>
      </section>
    </div>
  );
}
