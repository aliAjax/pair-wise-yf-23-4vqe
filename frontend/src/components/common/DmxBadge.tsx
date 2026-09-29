import { formatDmxRange } from "../../utils/formatters";

interface DmxBadgeProps {
  address: number;
  channelCount: number;
  conflict?: boolean;
}

/** DMX 通道徽标：压到已有通道时红色告警 */
export function DmxBadge({ address, channelCount, conflict = false }: DmxBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px] ${
        conflict
          ? "border-red-500/60 bg-red-500/15 text-red-300"
          : "border-edge bg-panel2 text-slate-300"
      }`}
      title={conflict ? "DMX 通道与其他灯具冲突" : "DMX 占用通道"}
    >
      {conflict && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-400" />}
      {formatDmxRange(address, channelCount)}
    </span>
  );
}
