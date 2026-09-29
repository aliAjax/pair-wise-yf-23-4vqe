import type { FixtureType } from "../../types/FixtureType";
import { FixtureTypeMeta, FixtureTypeText } from "../../constants/FixtureType";

interface FixtureIconProps {
  type: FixtureType;
  size?: number;
  active?: boolean;
  title?: string;
}

/** 灯具类型字形图标，灯具列表、舞台画布、场景编辑共用 */
export function FixtureIcon({ type, size = 28, active = false, title }: FixtureIconProps) {
  const meta = FixtureTypeMeta[type];
  return (
    <span
      title={title ?? FixtureTypeText[type]}
      className={`inline-flex items-center justify-center rounded-md border font-semibold tracking-wide transition-colors ${
        active
          ? "border-accent/70 bg-accent/20 text-accent"
          : "border-edge bg-panel2 text-slate-400"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {meta.glyph}
    </span>
  );
}
