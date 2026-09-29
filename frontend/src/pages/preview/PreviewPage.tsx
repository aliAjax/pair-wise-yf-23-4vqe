import { useMemo, useState } from "react";
import { useFixtureStore } from "../../stores/FixtureStore";
import { useCueSceneStore } from "../../stores/CueSceneStore";
import { useTimelineTrackStore } from "../../stores/TimelineTrackStore";
import { useTimelinePlayback } from "../../hooks/useTimelinePlayback";
import { StageCanvas } from "../../components/common/StageCanvas";
import { PlaybackControls } from "../../components/common/PlaybackControls";
import { StatCard } from "../../components/common/StatCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { FixtureIcon } from "../../components/common/FixtureIcon";
import { TIMELINE_DEFAULT_MS } from "../../constants/playback";
import { getTimelineEnd } from "../../utils/playback";
import { formatTimecode } from "../../utils/formatters";
import { stateToColor } from "../../utils/color";
import type { ActiveCue } from "../../utils/playback";
import type { FixtureRenderState } from "../../types/StageSnapshot";

export function PreviewPage() {
  const fixtures = useFixtureStore((state) => state.rows);
  const tracks = useTimelineTrackStore((state) => state.rows);
  const scenes = useCueSceneStore((state) => state.rows);

  const durationMs = useMemo(
    () => Math.max(TIMELINE_DEFAULT_MS, getTimelineEnd(tracks, TIMELINE_DEFAULT_MS)),
    [tracks]
  );
  const playback = useTimelinePlayback({ fixtures, tracks, scenes, durationMs });

  const litCount = Object.values(playback.snapshot).filter((state) => state.active && state.dimmer > 0).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="播放时刻" value={formatTimecode(playback.timeMs)} />
        <StatCard label="激活场景" value={playback.activeCues.length} hint="同刻叠加，高优先级覆盖" />
        <StatCard label="亮灯" value={`${litCount}/${fixtures.length}`} />
        <StatCard label="速度" value={`${playback.speed}×`} />
      </div>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <StageCanvas fixtures={fixtures} snapshot={playback.snapshot} height={480} />
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
        </div>

        <div className="w-80 shrink-0 space-y-3">
          <CueStack cues={playback.activeCues} />
          <FixtureStateList snapshot={playback.snapshot} />
        </div>
      </div>
    </div>
  );
}

/** 当前时刻的场景栈：按优先级从高到低展示覆盖关系 */
function CueStack({ cues }: { cues: ActiveCue[] }) {
  return (
    <section className="rounded-xl border border-edge bg-panel p-3">
      <h2 className="mb-2 text-sm font-semibold text-slate-100">场景叠加栈</h2>
      {cues.length === 0 ? (
        <p className="rounded bg-panel2 px-2 py-3 text-center text-xs text-slate-500">黑场：当前时刻没有激活场景</p>
      ) : (
        <ol className="space-y-1">
          {cues.map((cue, index) => (
            <li
              key={cue.track.id}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${
                index === 0 ? "border-accent bg-accent/10 text-accent" : "border-edge bg-panel2 text-slate-300"
              }`}
            >
              <span className="font-mono text-[10px] opacity-70">#{index + 1}</span>
              <span className="flex-1 truncate font-medium">{cue.scene.name}</span>
              <span className="rounded bg-black/30 px-1 text-[10px]">P{cue.scene.priority}</span>
              <span className="text-[10px] opacity-70">L{cue.track.layer}</span>
              <StatusBadge value={cue.scene.scene_status} />
              <span className="w-10 text-right font-mono text-[10px]">{Math.round(cue.progress * 100)}%</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        合成规则：逐台灯取优先级最高的命中场景；颜色、亮度与摇头位置按淡入进度从黑场插值到目标值。
      </p>
    </section>
  );
}

function FixtureStateList({ snapshot }: { snapshot: Record<string, FixtureRenderState> }) {
  const fixtures = useFixtureStore((state) => state.rows);
  const [onlyLit, setOnlyLit] = useState(false);
  const rows = fixtures.filter((fixture) => {
    const state = snapshot[fixture.id];
    return state && (!onlyLit || (state.active && state.dimmer > 0));
  });

  return (
    <section className="rounded-xl border border-edge bg-panel p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">灯具实时状态</h2>
        <label className="flex items-center gap-1 text-[11px] text-slate-400">
          <input type="checkbox" checked={onlyLit} onChange={(event) => setOnlyLit(event.target.checked)} className="!w-auto" />
          仅亮灯
        </label>
      </div>
      <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
        {rows.map((fixture) => {
          const state = snapshot[fixture.id];
          const color = state.active ? stateToColor(state) : "#3a4663";
          return (
            <li key={fixture.id} className="flex items-center gap-2 rounded-lg border border-edge bg-panel2 px-2 py-1.5 text-xs">
              <FixtureIcon type={fixture.fixture_type} size={22} active={state.active} />
              <span className="w-24 truncate font-mono text-slate-300">{fixture.fixture_code}</span>
              <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: color, boxShadow: state.active ? `0 0 8px ${color}` : undefined }} />
              <span className="ml-auto font-mono text-[10px] text-slate-400">
                R{Math.round(state.r)} G{Math.round(state.g)} B{Math.round(state.b)}
                {fixture.color_mode === "RGBW" ? ` W${Math.round(state.w)}` : ""} D{Math.round(state.dimmer)}
              </span>
            </li>
          );
        })}
        {rows.length === 0 && <p className="py-3 text-center text-xs text-slate-500">暂无亮灯灯具</p>}
      </ul>
    </section>
  );
}
