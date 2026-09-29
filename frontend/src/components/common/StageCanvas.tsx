import type { RenderedFixture } from "../../services/playbackEngine";
import { rgbCss, isLightColor } from "../../utils/color";
import { FixtureIcon } from "./FixtureIcon";

interface StageCanvasProps {
  rendered: RenderedFixture[];
  /** 是否绘制摇头灯当前位置到目标位置的连线 */
  showBeams?: boolean;
}

/**
 * 二维舞台预览：灯具按舞台百分比坐标摆放，叠加后的颜色/亮度直接上色，
 * 摇头灯位置随淡入插值移动。灯具布置页在空渲染（全黑）时也复用它做平面图。
 */
export function StageCanvas({ rendered, showBeams = true }: StageCanvasProps) {
  return (
    <div className="stage-canvas" role="img" aria-label="舞台灯光预览">
      <div className="stage-audience">观众席 ▲</div>
      <div className="stage-surface">
        {rendered.map(({ fixture, color, intensity, x, y, activeCues }) => {
          const lit = intensity > 0.02;
          const textLight = isLightColor(color);
          return (
            <div
              key={fixture.id}
              className={"stage-fixture" + (lit ? " is-lit" : "")}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                // 发光晕染随叠加后的颜色与亮度变化
                ["--glow" as string]: rgbCss(color, 0.55 * intensity),
                ["--lamp" as string]: rgbCss(color, 0.25 + 0.75 * intensity)
              }}
              title={`${fixture.fixture_code}${activeCues.length ? ` · ${activeCues.join(" / ")}` : ""}`}
            >
              {lit && showBeams ? <span className="stage-beam" style={{ background: `radial-gradient(ellipse at 50% 0%, ${rgbCss(color, 0.4 * intensity)}, transparent 70%)` }} /> : null}
              <span className={"stage-lamp " + (textLight ? "is-light" : "is-dark")} style={{ color: lit ? (textLight ? "#20231d" : "#f8f6ee") : "#9aa39a" }}>
                <FixtureIcon type={fixture.fixture_type} active={lit} />
              </span>
              <em className="stage-fixture-code">{fixture.fixture_code}</em>
            </div>
          );
        })}
      </div>
    </div>
  );
}
