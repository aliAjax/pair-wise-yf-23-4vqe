import type { Fixture } from "../../types/Fixture";
import type { StageSnapshot } from "../../types/StageSnapshot";
import type { FixtureRenderState } from "../../types/StageSnapshot";
import { FixtureTypeMeta } from "../../constants/FixtureType";
import { stateToColor, clamp01 } from "../../utils/color";

interface StageCanvasProps {
  fixtures: Fixture[];
  snapshot?: StageSnapshot;
  /** 是否允许在画布上拖动灯具（灯具布置页为 true，预览页为 false） */
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  height?: number;
}

const STAGE_PADDING = 6; // percent

/** 二维舞台：灯具按 position_x/y 落位，颜色与光束方向跟随播放合成结果 */
export function StageCanvas({
  fixtures,
  snapshot = {},
  editable = false,
  selectedId,
  onSelect,
  onMove,
  height = 420
}: StageCanvasProps) {
  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!editable) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!editable) return;
    event.preventDefault();
    const id = event.dataTransfer.getData("text/fixture-id");
    if (!id || !onMove) return;
    const point = toStagePoint(event.currentTarget, event.clientX, event.clientY);
    onMove(id, point.x, point.y);
  }

  return (
    <div
      data-stage
      className="relative w-full overflow-hidden rounded-xl border-2 border-edge bg-ink"
      style={{
        height,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "5% 10%"
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 幕布 / 观众席标注 */}
      <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-xs tracking-[0.5em] text-slate-600">
        舞 台 后 区
      </span>
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-white/5 px-3 py-0.5 text-xs tracking-[0.5em] text-slate-500">
        观 众 席
      </span>

      <BeamLayer fixtures={fixtures} snapshot={snapshot} />

      {/* 摇头灯目标落点标记（仅在有激活状态时） */}
      {fixtures
        .filter((fixture) => fixture.color_mode === "MOVING_HEAD")
        .map((fixture) => {
          const state = snapshot[fixture.id];
          if (!state?.active) return null;
          return (
            <span
              key={`target-${fixture.id}`}
              className="pointer-events-none absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/80"
              style={{
                left: `${state.target_x}%`,
                top: `${state.target_y}%`,
                backgroundColor: stateToColor(state),
                boxShadow: `0 0 8px ${stateToColor(state)}`
              }}
              title={`${fixture.fixture_code} 目标`}
            />
          );
        })}

      {fixtures.map((fixture) => (
        <FixtureNode
          key={fixture.id}
          fixture={fixture}
          renderState={snapshot[fixture.id]}
          editable={editable}
          selected={selectedId === fixture.id}
          onSelect={onSelect}
          onMove={onMove}
        />
      ))}
    </div>
  );
}

function toStagePoint(container: HTMLElement, clientX: number, clientY: number) {
  const rect = container.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return {
    x: Math.max(STAGE_PADDING, Math.min(100 - STAGE_PADDING, x)),
    y: Math.max(STAGE_PADDING, Math.min(100 - STAGE_PADDING, y))
  };
}

interface NodeProps {
  fixture: Fixture;
  renderState?: FixtureRenderState;
  editable: boolean;
  selected: boolean;
  onSelect?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
}

function FixtureNode({ fixture, renderState, editable, selected, onSelect, onMove }: NodeProps) {
  const intensity = renderState ? clamp01(renderState.dimmer / 255) : 0;
  const color = renderState && renderState.active ? stateToColor(renderState) : "#3a4663";
  const meta = FixtureTypeMeta[fixture.fixture_type];

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!editable || !onMove) return;
    event.preventDefault();
    const container = event.currentTarget.closest<HTMLElement>("[data-stage]") ?? event.currentTarget.parentElement;
    if (!container) return;
    const move = (moveEvent: PointerEvent) => {
      const point = toStagePoint(container, moveEvent.clientX, moveEvent.clientY);
      onMove(fixture.id, point.x, point.y);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <button
      type="button"
      data-stage-node
      onClick={() => onSelect?.(fixture.id)}
      onPointerDown={handlePointerDown}
      draggable={editable}
      onDragStart={(event) => event.dataTransfer.setData("text/fixture-id", fixture.id)}
      className="group absolute z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center focus:outline-none"
      style={{ left: `${fixture.position_x}%`, top: `${fixture.position_y}%`, cursor: editable ? "grab" : "pointer" }}
      title={`${fixture.fixture_code} · CH ${fixture.dmx_address}-${fixture.dmx_address + fixture.channel_count - 1}`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[9px] font-bold transition-transform group-hover:scale-110 ${
          selected ? "ring-2 ring-accent ring-offset-2 ring-offset-ink" : ""
        }`}
        style={{
          borderColor: color,
          backgroundColor: `${color}22`,
          color,
          boxShadow: renderState?.active ? `0 0 ${10 + intensity * 22}px ${color}` : "none"
        }}
      >
        {meta.glyph}
      </span>
      <span className="mt-0.5 rounded bg-ink/80 px-1 text-[10px] leading-tight text-slate-300">
        {fixture.fixture_code}
      </span>
    </button>
  );
}

/** 光束层：按灯具类型画 flood 光晕 / cone 锥光（含摇头灯指向）/ strobe 闪烁 */
function BeamLayer({ fixtures, snapshot }: { fixtures: Fixture[]; snapshot: StageSnapshot }) {
  const flash = typeof performance !== "undefined" ? Math.floor(performance.now() / 90) % 2 === 0 : true;
  return (
    <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {fixtures.map((fixture) => {
        const state = snapshot[fixture.id];
        if (!state?.active || state.dimmer === 0) return null;
        const intensity = clamp01(state.dimmer / 255);
        const color = stateToColor(state);
        const meta = FixtureTypeMeta[fixture.fixture_type];
        const opacity = intensity * 0.55;

        if (meta.beam === "cone") {
          const tx = fixture.color_mode === "MOVING_HEAD" ? state.target_x : fixture.position_x;
          const ty = fixture.color_mode === "MOVING_HEAD" ? state.target_y : Math.min(95, fixture.position_y + 22);
          return (
            <polygon
              key={`beam-${fixture.id}`}
              points={`${fixture.position_x - 3},${fixture.position_y} ${fixture.position_x + 3},${fixture.position_y} ${tx + 4},${ty} ${tx - 4},${ty}`}
              fill={color}
              opacity={opacity * 0.35}
            />
          );
        }
        if (meta.beam === "strobe") {
          return (
            <rect
              key={`beam-${fixture.id}`}
              x={0}
              y={fixture.position_y}
              width={100}
              height={100 - fixture.position_y}
              fill={color}
              opacity={flash ? opacity * 0.5 : opacity * 0.08}
            />
          );
        }
        // flood / spot：向舞台下方铺开的径向光晕
        return (
          <ellipse
            key={`beam-${fixture.id}`}
            cx={fixture.position_x}
            cy={Math.min(92, fixture.position_y + 16)}
            rx={meta.beam === "spot" ? 7 : 16}
            ry={meta.beam === "spot" ? 14 : 22}
            fill={color}
            opacity={opacity * 0.3}
          />
        );
      })}
    </svg>
  );
}
