import { TimelineRuler } from "./TimelineRuler";
import { formatTimecode } from "../../utils/formatters";
import { PLAYBACK_SPEEDS } from "../../constants/playback";

interface PlaybackControlsProps {
  timeMs: number;
  durationMs: number;
  playing: boolean;
  speed: number;
  onToggle: () => void;
  onStop: () => void;
  onSeek: (timeMs: number) => void;
  onSpeedChange: (speed: number) => void;
}

/** 播放控制条：时间轴页与舞台预览页共用 */
export function PlaybackControls({
  timeMs,
  durationMs,
  playing,
  speed,
  onToggle,
  onStop,
  onSeek,
  onSpeedChange
}: PlaybackControlsProps) {
  return (
    <div className="space-y-2 rounded-xl border border-edge bg-panel p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink transition-transform hover:scale-105"
          title={playing ? "暂停" : "播放"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          type="button"
          onClick={onStop}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-panel2 text-slate-300 hover:border-slate-500"
          title="停止并回到开头"
        >
          ■
        </button>
        <span className="font-mono text-sm text-slate-200">{formatTimecode(timeMs)}</span>
        <span className="font-mono text-xs text-slate-500">/ {formatTimecode(durationMs)}</span>
        <div className="ml-auto flex items-center gap-1">
          {PLAYBACK_SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSpeedChange(value)}
              className={`rounded px-2 py-1 text-xs ${
                speed === value ? "bg-accent text-ink" : "border border-edge text-slate-400 hover:text-slate-200"
              }`}
            >
              {value}×
            </button>
          ))}
        </div>
      </div>
      <TimelineRuler durationMs={durationMs} currentMs={timeMs} height={24} onSeek={onSeek} tickMs={10000} />
    </div>
  );
}
