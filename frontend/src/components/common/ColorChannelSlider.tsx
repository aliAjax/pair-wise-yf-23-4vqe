export type ChannelKind = "r" | "g" | "b" | "w" | "dimmer" | "target_x" | "target_y";

interface ColorChannelSliderProps {
  kind: ChannelKind;
  label: string;
  value: number;
  max?: number;
  accent?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

const KIND_ACCENT: Partial<Record<ChannelKind, string>> = {
  r: "#ef4444",
  g: "#22c55e",
  b: "#3b82f6",
  w: "#e5e7eb",
  dimmer: "#f5b301",
  target_x: "#a78bfa",
  target_y: "#f472b6"
};

/** 单通道滑杆：颜色 R/G/B/W、亮度、摇头灯目标 X/Y 共用 */
export function ColorChannelSlider({
  kind,
  label,
  value,
  max = 255,
  accent,
  disabled = false,
  onChange
}: ColorChannelSliderProps) {
  const color = accent ?? KIND_ACCENT[kind] ?? "#f5b301";
  return (
    <label className={`flex items-center gap-3 text-xs ${disabled ? "opacity-40" : ""}`}>
      <span className="w-12 shrink-0 text-slate-400">{label}</span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(Math.max(0, Math.min(max, Number(event.target.value))))
        }
        className="slider flex-1"
        style={{ ["--slider-accent" as string]: color }}
      />
      <span className="w-9 shrink-0 text-right font-mono text-slate-300">{Math.round(value)}</span>
    </label>
  );
}
