import { useState } from "react";
import type { CueScene } from "../../types/CueScene";
import { CueCard } from "../../components/common/CueCard";
import { TIMELINE_STEP_MS } from "../../constants/playback";
import { formatDuration } from "../../utils/formatters";

interface TrackComposerProps {
  scenes: CueScene[];
  onAdd: (cueId: string, layer: number, startMs: number) => void;
}

/** 右侧素材库：场景可拖拽到轨道，也可填表精确加入 */
export function TrackComposer({ scenes, onAdd }: TrackComposerProps) {
  const [cueId, setCueId] = useState(scenes[0]?.id ?? "");
  const [layer, setLayer] = useState(1);
  const [startSec, setStartSec] = useState(0);

  return (
    <aside className="w-72 shrink-0 space-y-3 rounded-xl border border-edge bg-panel p-3">
      <h2 className="text-sm font-semibold text-slate-100">场景素材库</h2>
      <p className="text-[11px] leading-relaxed text-slate-500">
        拖动卡片到左侧同一层轨道：片段首尾可相接但不能重叠；锁定层拒绝放入与改动。停用/归档场景不出现在列表中。
      </p>

      <div className="space-y-2">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/cue-id", scene.id);
              event.dataTransfer.effectAllowed = "copy";
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <CueCard
              scene={scene}
              fixtures={[]}
              compact
            />
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-edge bg-panel2 p-3">
        <p className="text-xs font-medium text-slate-300">精确加入</p>
        <select value={cueId} onChange={(event) => setCueId(event.target.value)} className="!text-xs">
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-slate-400">
            层级
            <input type="number" min={1} max={9} value={layer} onChange={(event) => setLayer(Math.max(1, Number(event.target.value)))} className="mt-1" />
          </label>
          <label className="text-[11px] text-slate-400">
            起始（秒）
            <input type="number" min={0} step={TIMELINE_STEP_MS / 1000} value={startSec} onChange={(event) => setStartSec(Math.max(0, Number(event.target.value)))} className="mt-1" />
          </label>
        </div>
        <button
          type="button"
          className="btn-primary w-full"
          disabled={!cueId}
          onClick={() => onAdd(cueId, layer, startSec * 1000)}
        >
          加入时间轴
        </button>
        <p className="text-[10px] text-slate-500">默认时长取场景保持时间，否则 5 秒（{formatDuration(5000)}）。</p>
      </div>
    </aside>
  );
}
