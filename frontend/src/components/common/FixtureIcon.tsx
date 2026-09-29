import type { FixtureType } from "../../types/FixtureType";
import { FIXTURE_TYPE_TEXT } from "../../constants/FixtureType";

/** 灯具类型小图标（纯 SVG/CSS）：灯具布置、场景编辑、舞台预览共用 */
export function FixtureIcon({ type, active = false }: { type: FixtureType; active?: boolean }) {
  const label = FIXTURE_TYPE_TEXT[type];
  return (
    <span className={"fixture-icon fixture-icon-" + type.toLowerCase() + (active ? " is-active" : "")} title={label} aria-label={label}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        {type === "STROBE" ? (
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor" />
        ) : type === "BEAM" ? (
          <>
            <circle cx="12" cy="8" r="4" fill="currentColor" />
            <path d="M12 12v9M8 21h8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="12" cy="9" rx="7" ry="5" fill="currentColor" />
            <path d="M9 14h6l2 7H7l2-7z" fill="currentColor" opacity="0.7" />
          </>
        )}
      </svg>
    </span>
  );
}
