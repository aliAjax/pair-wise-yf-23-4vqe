import { DMX_UNIVERSE_SIZE } from "../../constants/dmx";
import { useDmxAddressCheck } from "../../hooks/useDmxAddressCheck";
import type { Fixture } from "../../types/Fixture";
import { dmxRangeOf } from "../../utils/dmx";

interface UniverseBarProps {
  fixtures: Fixture[];
  candidate?: Pick<Fixture, "id" | "dmx_address" | "channel_count"> | null;
  height?: number;
}

/**
 * 整条 DMX512 通道条：已占用通道按灯具着色，候选地址段用描边框显示；
 * 与已有通道压线时冲突段变红。
 */
export function UniverseBar({ fixtures, candidate, height = 44 }: UniverseBarProps) {
  const { channelOwners, conflict, utilization } = useDmxAddressCheck(fixtures, candidate);
  const candidateRange = candidate ? dmxRangeOf(candidate) : null;

  return (
    <div className="rounded-xl border border-edge bg-panel p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>DMX512 通道占用</span>
        <span className="font-mono">
          {Math.round(utilization * 100)}% · {fixtures.length} 台灯具
          {conflict && <span className="ml-2 font-semibold text-red-400">与 {conflict.fixture_code} 冲突</span>}
        </span>
      </div>
      <div className="relative flex w-full overflow-hidden rounded border border-edge" style={{ height }}>
        {channelOwners.map((owner, index) => (
          <div
            key={index}
            className="h-full flex-1"
            style={{
              backgroundColor: owner ? fixtureColor(owner.id) : "transparent",
              borderRight: (index + 1) % 64 === 0 ? "1px solid rgba(255,255,255,0.25)" : undefined
            }}
            title={owner ? `CH ${index + 1} · ${owner.fixture_code}` : `CH ${index + 1} 空闲`}
          />
        ))}
        {candidateRange && (
          <div
            className={`absolute top-0 h-full border-2 ${conflict ? "border-red-400 bg-red-500/30" : "border-accent bg-accent/20"}`}
            style={{
              left: `${((candidateRange.begin - 1) / DMX_UNIVERSE_SIZE) * 100}%`,
              width: `${(candidateRange.end - candidateRange.begin + 1) / (DMX_UNIVERSE_SIZE / 100)}%`
            }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-600">
        <span>1</span>
        <span>128</span>
        <span>256</span>
        <span>384</span>
        <span>512</span>
      </div>
    </div>
  );
}

function fixtureColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 65% 45% / 0.85)`;
}
