import type { Fixture } from "../../types/Fixture";
import type { FixtureState } from "../../types/Fixture";

interface ColorChannelSliderProps {
  fixture: Fixture;
  state: FixtureState;
  onChange: (next: FixtureState) => void;
}

/**
 * 颜色 / 亮度通道滑杆：场景编辑中为单台灯设置颜色与亮度，
 * MOVING_HEAD 额外显示目标舞台坐标（水平/垂直）。
 */
export function ColorChannelSlider({ fixture, state, onChange }: ColorChannelSliderProps) {
  const moving = fixture.color_mode === "MOVING_HEAD";
  return (
    <div className="channel-slider">
      <div className="channel-row">
        <label className="channel-color">
          <span>颜色</span>
          <input
            type="color"
            value={state.color}
            onChange={(event) => onChange({ ...state, color: event.target.value })}
          />
          <code>{state.color.toUpperCase()}</code>
        </label>
        <label className="channel-brightness">
          <span>亮度 {state.brightness}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={state.brightness}
            onChange={(event) => onChange({ ...state, brightness: Number(event.target.value) })}
          />
        </label>
      </div>
      {moving ? (
        <div className="channel-row channel-moving">
          <label>
            <span>水平 X {state.target_x ?? fixture.position_x}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={state.target_x ?? fixture.position_x}
              onChange={(event) => onChange({ ...state, target_x: Number(event.target.value) })}
            />
          </label>
          <label>
            <span>垂直 Y {state.target_y ?? fixture.position_y}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={state.target_y ?? fixture.position_y}
              onChange={(event) => onChange({ ...state, target_y: Number(event.target.value) })}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
