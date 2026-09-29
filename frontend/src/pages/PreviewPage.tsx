import { useMemo } from "react";
import { useFixtureStore } from "../stores/FixtureStore";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { useTimelinePlayback } from "../hooks/useTimelinePlayback";
import { renderStageAt } from "../services/playbackEngine";
import { trackEnd } from "../services/TimelineService";
import { StageCanvas } from "../components/common/StageCanvas";
import { TimelineRuler } from "../components/common/TimelineRuler";
import { StatusBadge } from "../components/common/StatusBadge";
import { TIMELINE_CONSTANTS } from "../constants/appConfig";
import { formatClock, formatClockSeconds } from "../utils/formatters";
import { rgbCss, parseHexColor } from "../utils/color";

export function PreviewPage() {
  const fixtures = useFixtureStore((state) => state.rows);
  const cues = useCueSceneStore((state) => state.rows);
  const tracks = useTimelineTrackStore((state) => state.rows);
  const playback = useTimelinePlayback(tracks);

  const cueById = useMemo(() => new Map(cues.map((cue) => [cue.id, cue])), [cues]);
  const rendered = useMemo(
    () => renderStageAt(playback.timeMs, fixtures, cues, tracks),
    [playback.timeMs, fixtures, cues, tracks]
  );

  // 当前时刻正在演出的轨道块（按优先级低→高）
  const activeTracks = tracks
    .filter((track) => playback.timeMs >= track.start_ms && playback.timeMs < trackEnd(track))
    .map((track) => ({ track, cue: cueById.get(track.cue_scene_id) }))
    .filter((item) => item.cue)
    .sort((a, b) => (a.cue!.priority - b.cue!.priority) || a.track.id - b.track.id);

  const width = (playback.durationMs / 1000) * TIMELINE_CONSTANTS.PX_PER_SECOND;
  const litCount = rendered.filter((item) => item.intensity > 0.02).length;

  return (
    <div className="page-grid page-grid-preview">
      <section className="panel panel-stage-preview">
        <div className="panel-head">
          <div>
            <h2>舞台预览</h2>
            <p className="panel-sub">
              播放时刻 {formatClock(playback.timeMs)} · 点亮 {litCount}/{fixtures.length} 台灯 ·
              高优先级场景覆盖低优先级
            </p>
          </div>
          <div className="playback-controls">
            <button type="button" className="btn" onClick={playback.stop}>⏹ 回开头</button>
            <button type="button" className="btn btn-primary" onClick={playback.toggle}>
              {playback.playing ? "⏸ 暂停" : "▶ 试演"}
            </button>
          </div>
        </div>
        <StageCanvas rendered={rendered} />
        <div className="preview-scrubber">
          <TimelineRuler durationMs={playback.durationMs} timeMs={playback.timeMs} onSeek={playback.seek} height={34} />
          <input
            className="preview-range"
            type="range"
            min={0}
            max={playback.durationMs}
            step={TIMELINE_CONSTANTS.SNAP_GRID_MS}
            value={Math.min(playback.timeMs, playback.durationMs)}
            onChange={(event) => playback.seek(Number(event.target.value))}
            style={{ width }}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>叠加场景栈</h2></div>
        {activeTracks.length === 0 ? (
          <p className="panel-sub">该时刻没有正在演出的场景，黑场中。拖动刻度尺或点击「试演」。</p>
        ) : (
          <ol className="overlay-stack">
            {activeTracks.map(({ track, cue }) => (
              <li key={track.id} className="overlay-item">
                <div className="overlay-rank">
                  <span className="overlay-priority">P{cue!.priority}</span>
                  <StatusBadge value={cue!.scene_status} />
                </div>
                <div className="overlay-main">
                  <strong>{cue!.name}</strong>
                  <span>图层 {track.layer} · {formatClockSeconds(track.start_ms)}–{formatClockSeconds(trackEnd(track))}</span>
                </div>
                <div className="overlay-swatches">
                  {cue!.fixture_states.slice(0, 8).map((state) => (
                    <i key={state.fixture_id} className="swatch"
                      style={{ background: rgbCss(parseHexColor(state.color), 0.35 + (state.brightness / 100) * 0.65) }} />
                  ))}
                </div>
              </li>
            ))}
            <li className="overlay-hint">↑ 列表顶部优先级最低，底部（高优先级）覆盖顶部颜色与亮度</li>
          </ol>
        )}

        <h3 className="subhead">此刻灯位状态</h3>
        <ul className="live-fixture-list">
          {rendered.map((item) => (
            <li key={item.fixture.id} className={item.intensity > 0.02 ? "is-lit" : ""}>
              <span className="live-dot" style={{ background: rgbCss(item.color, Math.max(0.15, item.intensity)) }} />
              <strong>{item.fixture.fixture_code}</strong>
              <span>
                {item.intensity > 0.02
                  ? `${rgbCss(item.color, 1)} · ${Math.round(item.intensity * 100)}% · 位(${Math.round(item.x)}, ${Math.round(item.y)})`
                  : "熄灭"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
