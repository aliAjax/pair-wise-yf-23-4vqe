import type { CueScene } from "../../types/CueScene";
import type { Fixture } from "../../types/Fixture";
import { StatusBadge } from "./StatusBadge";
import { formatDuration } from "../../utils/formatters";

interface CueCardProps {
  scene: CueScene;
  fixtures: Fixture[];
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
}

/** 场景卡片：场景列表与时间轴素材库共用 */
export function CueCard({ scene, fixtures, selected, compact, onClick, actions }: CueCardProps) {
  const bound = Object.keys(scene.fixture_states).length;
  return (
    <article
      onClick={onClick}
      className={`rounded-lg border p-3 transition-colors ${
        selected ? "border-accent bg-accent/10" : "border-edge bg-panel hover:border-slate-500"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-slate-100">{scene.name}</h3>
        <StatusBadge value={scene.scene_status} />
      </div>
      {!compact && (
        <p className="mt-1 text-xs text-slate-400">
          命中灯具 {bound}/{fixtures.length} 台 · 淡入 {formatDuration(scene.fade_in_ms)} · 优先级 P{scene.priority}
        </p>
      )}
      {actions && <div className="mt-2 flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}>{actions}</div>}
    </article>
  );
}
