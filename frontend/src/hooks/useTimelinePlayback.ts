import { useCallback, useEffect, useRef, useState } from "react";
import type { TimelineTrack } from "../types/TimelineTrack";
import { timelineDuration } from "../services/playbackEngine";

export interface PlaybackState {
  timeMs: number;
  playing: boolean;
  durationMs: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (ms: number) => void;
  toggle: () => void;
}

/**
 * 时间轴播放 hook：requestAnimationFrame 按真实墙钟推进播放头，
 * 播到总时长自动停止。舞台预览页与时间轴页共享同一播放语义。
 */
export function useTimelinePlayback(tracks: TimelineTrack[]): PlaybackState {
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const durationMs = timelineDuration(tracks);

  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);
  const originRef = useRef<{ wall: number; time: number } | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = (wall: number) => {
      const total = timelineDuration(tracksRef.current);
      const origin = originRef.current ?? { wall, time: timeMsRef.current };
      originRef.current = origin;
      const next = origin.time + (wall - origin.wall);
      if (next >= total) {
        setTimeMs(total);
        setPlaying(false);
        originRef.current = null;
        return;
      }
      setTimeMs(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const timeMsRef = useRef(0);
  timeMsRef.current = timeMs;

  const play = useCallback(() => {
    const total = timelineDuration(tracksRef.current);
    setTimeMs((current) => (current >= total ? 0 : current));
    originRef.current = null;
    setPlaying(true);
  }, []);

  const pause = useCallback(() => setPlaying(false), []);
  const stop = useCallback(() => {
    setPlaying(false);
    setTimeMs(0);
    originRef.current = null;
  }, []);

  const seek = useCallback((ms: number) => {
    const total = timelineDuration(tracksRef.current);
    setTimeMs(Math.max(0, Math.min(ms, total)));
    originRef.current = null;
  }, []);

  const toggle = useCallback(() => setPlaying((value) => !value), []);

  return { timeMs, playing, durationMs, play, pause, stop, seek, toggle };
}
