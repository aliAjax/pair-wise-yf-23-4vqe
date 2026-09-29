import type { CueScene } from "../../types/CueScene";
import type { Fixture } from "../../types/Fixture";
import { StatusBadge } from "./StatusBadge";
import { formatClockSeconds } from "../../utils/formatters";
import { FIXTURE_TYPE_TEXT } from "../../constants/FixtureType";

interface CueCardProps {
  cue: CueScene;
  fixtures: Fixture[];
  selected?: boolean;
  compact?: boolean;
  onSelect?: (cue: CueScene) => void;
  onStatusClick?: (cue: CueScene) => void;
}

/** 场景卡片：场景编辑列表与时间轴场景库共用，拖拽源由调用方在元素上挂 draggable */
export function CueCard({ cue, fixtures, selected, compact, onSelect, onStatusClick }: CueCardProps) {
  const fixtureMap = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const swatches = cue.fixture_states.slice(0, 6);
  return (
    <article
      className={"cue-card" + (selected ? " is-selected" : "") + (compact ? " is-compact" : "")}
      onClick={() => onSelect?.(cue)}
    >
      <header className="cue-card-head">
        <div>
          <strong>{cue.name}</strong>
          <span className="cue-card-meta">
            P{cue.priority} · 淡入 {formatClockSeconds(cue.fade_in_ms)} · {cue.fixture_states.length} 台灯
          </span>
        </div>
        {onStatusClick ? (
          <button
            type="button"
            className="cue-card-badge"
            title="点击切换状态"
            onClick={(event) => {
              event.stopPropagation();
              onStatusClick(cue);
            }}
          >
            <StatusBadge value={cue.scene_status} />
          </button>
        ) : (
          <StatusBadge value={cue.scene_status} />
        )}
      </header>
      <div className="cue-card-swatches">
        {swatches.length === 0 ? (
          <span className="cue-card-empty">尚未选择灯具</span>
        ) : (
          swatches.map((state) => {
            const fixture = fixtureMap.get(state.fixture_id);
            return (
              <span
                key={state.fixture_id}
                className="swatch"
                style={{ background: state.color, opacity: 0.35 + (state.brightness / 100) * 0.65 }}
                title={`${fixture?.fixture_code ?? "?"} ${fixture ? FIXTURE_TYPE_TEXT[fixture.fixture_type] : ""} · ${state.brightness}%`}
              />
            );
          })
        )}
      </div>
    </article>
  );
}
