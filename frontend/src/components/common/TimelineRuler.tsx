import { useMemo } from "react";
import { TIMELINE_CONSTANTS } from "../../constants/appConfig";
import { formatClockSeconds } from "../../utils/formatters";

interface TimelineRulerProps {
  durationMs: number;
  timeMs?: number;
  onSeek?: (ms: number) => void;
  height?: number;
}

/** 时间轴刻度尺：每 1s 一小格、5s 一大格，点击可拖动播放头（预览页复用） */
export function TimelineRuler({ durationMs, timeMs, onSeek, height = 28 }: TimelineRulerProps) {
  const width = (durationMs / 1000) * TIMELINE_CONSTANTS.PX_PER_SECOND;
  const ticks = useMemo(() => {
    const result: { ms: number; major: boolean }[] = [];
    for (let ms = 0; ms <= durationMs; ms += 1000) {
      result.push({ ms, major: ms % 5000 === 0 });
    }
    return result;
  }, [durationMs]);

  return (
    <div
      className={"timeline-ruler" + (onSeek ? " is-seekable" : "")}
      style={{ width, height }}
      onClick={(event) => {
        if (!onSeek) return;
        const rect = event.currentTarget.getBoundingClientRect();
        onSeek(((event.clientX - rect.left) / TIMELINE_CONSTANTS.PX_PER_SECOND) * 1000);
      }}
    >
      {ticks.map((tick) => (
        <span
          key={tick.ms}
          className={"ruler-tick" + (tick.major ? " major" : "")}
          style={{ left: (tick.ms / 1000) * TIMELINE_CONSTANTS.PX_PER_SECOND }}
        >
          {tick.major ? <em>{formatClockSeconds(tick.ms)}</em> : null}
        </span>
      ))}
      {timeMs !== undefined ? (
        <span className="ruler-playhead" style={{ left: (timeMs / 1000) * TIMELINE_CONSTANTS.PX_PER_SECOND }} />
      ) : null}
    </div>
  );
}
