import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { StageSnapshot } from "../types/StageSnapshot";
import { composeSnapshot, getActiveCues, type ActiveCue } from "../utils/playback";
import type { Fixture } from "../types/Fixture";
import { PLAYBACK_SPEEDS } from "../constants/playback";

interface PlaybackOptions {
  fixtures: Fixture[];
  tracks: TimelineTrack[];
  scenes: CueScene[];
  durationMs: number;
}

export interface TimelinePlayback {
  timeMs: number;
  playing: boolean;
  speed: number;
  snapshot: StageSnapshot;
  activeCues: ActiveCue[];
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  seek: (timeMs: number) => void;
  setSpeed: (speed: number) => void;
}

/** 时间轴试演引擎：requestAnimationFrame 推进播放头并逐帧合成舞台状态 */
export function useTimelinePlayback({
  fixtures,
  tracks,
  scenes,
  durationMs
}: PlaybackOptions): TimelinePlayback {
  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(PLAYBACK_SPEEDS[1]);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const scenesById = useMemo(() => new Map(scenes.map((scene) => [scene.id, scene])), [scenes]);

  // 片段缩短后播放头可能超出总时长，钳回末尾
  useEffect(() => {
    setTimeMs((previous) => Math.min(previous, durationMs));
  }, [durationMs]);

  useEffect(() => {
    if (!playing) return;
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setTimeMs((previous) => {
        const next = previous + delta * speed;
        if (next >= durationMs) {
          setPlaying(false);
          return durationMs;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed, durationMs]);

  const play = useCallback(() => {
    setTimeMs((previous) => (previous >= durationMs ? 0 : previous));
    setPlaying(true);
  }, [durationMs]);

  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);
  const stop = useCallback(() => {
    setPlaying(false);
    setTimeMs(0);
  }, []);
  const seek = useCallback(
    (value: number) => setTimeMs(Math.max(0, Math.min(durationMs, value))),
    [durationMs]
  );

  const snapshot = useMemo(
    () => composeSnapshot(timeMs, fixtures, tracks, scenes),
    [timeMs, fixtures, tracks, scenes]
  );

  const activeCues = useMemo(
    () => getActiveCues(timeMs, tracks, scenesById),
    [timeMs, tracks, scenesById]
  );

  return {
    timeMs,
    playing,
    speed,
    snapshot,
    activeCues,
    play,
    pause,
    toggle,
    stop,
    seek,
    setSpeed
  };
}
