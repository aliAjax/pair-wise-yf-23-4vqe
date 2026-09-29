import { useRef, useState } from "react";
import type { TimelineTrack } from "../../types/TimelineTrack";
import type { CueScene } from "../../types/CueScene";
import { TIMELINE_STEP_MS, TIMELINE_MIN_DURATION_MS } from "../../constants/playback";
import { snapTime } from "../../utils/timeline";
import { formatDuration, formatTimecode } from "../../utils/formatters";
import { StatusBadge } from "../../components/common/StatusBadge";

interface TimelineBlockProps {
  track: TimelineTrack;
  scene: CueScene | undefined;
  durationMs: number;
  laneHeight: number;
  active: boolean;
  locked: boolean;
  onChange: (next: TimelineTrack) => void;
  onRemove: () => void;
}

type DragMode = "move" | "resize-left" | "resize-right" | null;

/** 时间轴片段块：可拖动改时刻、左右把手改时长；锁层禁用全部交互 */
export function TimelineBlock({
  track,
  scene,
  durationMs,
  laneHeight,
  active,
  locked,
  onChange,
  onRemove
}: TimelineBlockProps) {
  const [local, setLocal] = useState<TimelineTrack | null>(null);
  const dragState = useRef<{
    mode: DragMode;
    startX: number;
    origin: TimelineTrack;
    ppm: number;
  } | null>(null);

  const shown = local ?? track;
  const left = (shown.start_ms / durationMs) * 100;
  const width = (shown.duration_ms / durationMs) * 100;
  const missing = !scene;
  const label = scene?.name ?? "（场景已删除）";

  function beginDrag(mode: DragMode) {
    return (event: React.PointerEvent) => {
      if (locked || missing) return;
      event.preventDefault();
      event.stopPropagation();
      const laneWidth = event.currentTarget.closest("[data-lane]")?.getBoundingClientRect().width ?? 1;
      dragState.current = {
        mode,
        startX: event.clientX,
        origin: track,
        ppm: laneWidth / durationMs // 每毫秒像素数
      };
      setLocal(track);

      const move = (moveEvent: PointerEvent) => {
        const drag = dragState.current;
        if (!drag) return;
        const deltaMs = (moveEvent.clientX - drag.startX) / drag.ppm;
        const base = drag.origin;
        if (drag.mode === "move") {
          setLocal({ ...base, start_ms: snapTime(base.start_ms + deltaMs, TIMELINE_STEP_MS) });
        } else if (drag.mode === "resize-left") {
          const newStart = snapTime(base.start_ms + deltaMs, TIMELINE_STEP_MS);
          const nextDuration = base.start_ms + base.duration_ms - newStart;
          if (nextDuration >= TIMELINE_MIN_DURATION_MS) {
            setLocal({ ...base, start_ms: newStart, duration_ms: nextDuration });
          }
        } else if (drag.mode === "resize-right") {
          const nextDuration = Math.max(
            TIMELINE_MIN_DURATION_MS,
            snapTime(base.duration_ms + deltaMs, TIMELINE_STEP_MS)
          );
          setLocal({ ...base, duration_ms: nextDuration });
        }
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        const drag = dragState.current;
        dragState.current = null;
        if (!drag) return;
        setLocal((current) => {
          if (
            current &&
            (current.start_ms !== track.start_ms || current.duration_ms !== track.duration_ms)
          ) {
            // 校验失败（同层重叠/锁层）时 service 抛错，回退到服务端确认后的位置
            Promise.resolve(onChange(current)).catch(() => undefined);
            return null;
          }
          return null;
        });
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
  }

  return (
    <div
      data-block
      className={`group absolute top-1 z-10 overflow-hidden rounded-md border text-left ${
        missing
          ? "border-red-500/60 bg-red-950/40 text-red-300"
          : active
            ? "border-accent bg-accent/25 text-accent shadow-[0_0_10px_rgba(245,179,1,0.35)]"
            : "border-sky-500/50 bg-sky-900/50 text-sky-200 hover:border-sky-400"
      } ${locked ? "cursor-not-allowed" : "cursor-grab"}`}
      style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%`, height: laneHeight - 8 }}
      onPointerDown={beginDrag("move")}
      title={`${label} · ${formatTimecode(shown.start_ms)} + ${formatDuration(shown.duration_ms)} · P${scene?.priority ?? "-"}`}
    >
      {!locked && !missing && (
        <>
          <span
            className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize bg-white/20 opacity-0 group-hover:opacity-100"
            onPointerDown={beginDrag("resize-left")}
          />
          <span
            className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize bg-white/20 opacity-0 group-hover:opacity-100"
            onPointerDown={beginDrag("resize-right")}
          />
        </>
      )}
      <div className="flex h-full items-center gap-1 px-2">
        <span className="truncate text-[11px] font-semibold">{label}</span>
        {scene && (
          <span className="ml-auto flex shrink-0 items-center gap-1">
            <span className="rounded bg-black/30 px-1 text-[9px]">P{scene.priority}</span>
            <StatusBadge value={scene.scene_status} />
            <button
              type="button"
              className="rounded px-1 text-[10px] opacity-0 transition-opacity hover:bg-black/40 group-hover:opacity-100"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              ✕
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
