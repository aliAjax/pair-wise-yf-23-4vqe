import { formatTimecode } from "../../utils/formatters";

interface TimelineRulerProps {
  durationMs: number;
  /** 当前播放头时刻，毫秒 */
  currentMs?: number;
  /** 刻度间隔，毫秒 */
  tickMs?: number;
  height?: number;
  onSeek?: (timeMs: number) => void;
}

/** 时间轴标尺：刻度尺 + 播放头，时间轴页与舞台预览页共用 */
export function TimelineRuler({
  durationMs,
  currentMs,
  tickMs = 5000,
  height = 28,
  onSeek
}: TimelineRulerProps) {
  const ticks: number[] = [];
  for (let t = 0; t <= durationMs; t += tickMs) ticks.push(t);
  const playhead = currentMs === undefined ? null : (currentMs / durationMs) * 100;

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!onSeek) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)) * durationMs);
  }

  return (
    <div
      className={`relative w-full select-none overflow-hidden rounded border border-edge bg-panel2 ${onSeek ? "cursor-pointer" : ""}`}
      style={{ height }}
      onClick={handleClick}
    >
      {ticks.map((tick) => (
        <div key={tick} className="absolute top-0 h-full" style={{ left: `${(tick / durationMs) * 100}%` }}>
          <span className="absolute bottom-0.5 left-1 text-[10px] text-slate-500">
            {formatTimecode(tick)}
          </span>
          <span className="absolute left-0 top-0 h-2 w-px bg-edge" />
        </div>
      ))}
      {playhead !== null && (
        <span className="absolute top-0 z-10 h-full w-0.5 bg-accent shadow-[0_0_6px_rgba(245,179,1,0.8)]" style={{ left: `${playhead}%` }} />
      )}
    </div>
  );
}
