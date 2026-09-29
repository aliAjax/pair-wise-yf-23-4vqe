import { useEffect, useState } from "react";
import type { CueScene } from "../../types/CueScene";
import type { Fixture } from "../../types/Fixture";
import type { FixtureState } from "../../types/FixtureState";
import { createEmptyFixtureState } from "../../types/FixtureState";
import { useCueSceneStore } from "../../stores/CueSceneStore";
import { useUiStore, withToast } from "../../stores/UiStore";
import { ColorChannelSlider, type ChannelKind } from "../../components/common/ColorChannelSlider";
import { FixtureIcon } from "../../components/common/FixtureIcon";
import { DmxBadge } from "../../components/common/DmxBadge";
import { StatusBadge } from "../../components/common/StatusBadge";
import { supportsColor, supportsPanTilt } from "../../constants/ChannelMode";
import { rgbToHex, hexToRgb, stateToColor } from "../../utils/color";

interface SceneEditorProps {
  scene: CueScene;
  fixtures: Fixture[];
}

/** 场景编辑主区：场景属性 + 每台灯的颜色/亮度/摇头目标，所有改动即时保存 */
export function SceneEditor({ scene, fixtures }: SceneEditorProps) {
  const update = useCueSceneStore((state) => state.update);
  const patchState = useCueSceneStore((state) => state.patchFixtureState);
  const pushToast = useUiStore((state) => state.pushToast);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(
    Object.keys(scene.fixture_states)[0] ?? fixtures[0]?.id ?? null
  );
  const [name, setName] = useState(scene.name);
  const [fadeIn, setFadeIn] = useState(scene.fade_in_ms);
  const [hold, setHold] = useState(scene.hold_ms);
  const [priority, setPriority] = useState(scene.priority);

  // 切换场景时同步本地表单
  useEffect(() => {
    setName(scene.name);
    setFadeIn(scene.fade_in_ms);
    setHold(scene.hold_ms);
    setPriority(scene.priority);
    setSelectedFixtureId(Object.keys(scene.fixture_states)[0] ?? fixtures[0]?.id ?? null);
  }, [scene.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedFixture = fixtures.find((fixture) => fixture.id === selectedFixtureId) ?? null;
  const selectedState: FixtureState | null = selectedFixture
    ? scene.fixture_states[selectedFixture.id] ?? null
    : null;

  async function saveMeta(next: Partial<CueScene>) {
    await withToast(() => update({ ...scene, ...next }), "场景属性已保存", pushToast);
  }

  async function saveFixtureState(fixtureId: string, state: FixtureState) {
    await patchState(scene, fixtureId, state);
  }

  return (
    <div className="space-y-4 rounded-xl border border-edge bg-panel p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="!w-64 !text-base !font-semibold"
        />
        <StatusBadge value={scene.scene_status} />
        <button
          type="button"
          className="btn-primary ml-auto"
          onClick={() => void saveMeta({ name: name.trim() || scene.name, fade_in_ms: fadeIn, hold_ms: hold, priority })}
        >
          💾 保存场景属性
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs text-slate-400">
          淡入时间（ms）
          <input type="number" min={0} step={100} value={fadeIn} onChange={(event) => setFadeIn(Number(event.target.value))} className="mt-1" />
        </label>
        <label className="text-xs text-slate-400">
          保持时间（ms，0=跟随片段）
          <input type="number" min={0} step={500} value={hold} onChange={(event) => setHold(Number(event.target.value))} className="mt-1" />
        </label>
        <label className="text-xs text-slate-400">
          优先级（越大越优先）
          <input type="number" min={0} max={99} value={priority} onChange={(event) => setPriority(Number(event.target.value))} className="mt-1" />
        </label>
      </div>

      <div className="flex gap-4">
        <div className="w-64 shrink-0 space-y-1">
          <p className="text-xs font-medium text-slate-400">灯具（{Object.keys(scene.fixture_states).length} 台已纳入场景）</p>
          {fixtures.map((fixture) => {
            const included = Boolean(scene.fixture_states[fixture.id]);
            return (
              <button
                key={fixture.id}
                type="button"
                onClick={() => setSelectedFixtureId(fixture.id)}
                className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs ${
                  selectedFixtureId === fixture.id
                    ? "border-accent bg-accent/10"
                    : "border-edge bg-panel2 hover:border-slate-500"
                }`}
              >
                <FixtureIcon type={fixture.fixture_type} size={24} active={included} />
                <span className="flex-1 truncate font-mono text-slate-200">{fixture.fixture_code}</span>
                {included ? (
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: stateToColor(scene.fixture_states[fixture.id]) }}
                  />
                ) : (
                  <span className="text-[10px] text-slate-500">未纳入</span>
                )}
              </button>
            );
          })}
        </div>

        {selectedFixture && (
          <FixtureStatePanel
            key={selectedFixture.id}
            fixture={selectedFixture}
            state={selectedState}
            onChange={(state) => void saveFixtureState(selectedFixture.id, state)}
            onExclude={() =>
              void withToast(
                () =>
                  update({
                    ...scene,
                    fixture_states: Object.fromEntries(
                      Object.entries(scene.fixture_states).filter(([id]) => id !== selectedFixture.id)
                    )
                  }),
                `已将 ${selectedFixture.fixture_code} 移出场景`,
                pushToast
              )
            }
          />
        )}
      </div>
    </div>
  );
}

interface PanelProps {
  fixture: Fixture;
  state: FixtureState | null;
  onChange: (state: FixtureState) => void;
  onExclude: () => void;
}

function FixtureStatePanel({ fixture, state, onChange, onExclude }: PanelProps) {
  const current = state ?? createEmptyFixtureState();
  const colorMode = fixture.color_mode;
  const colorSupported = supportsColor(colorMode);
  const panTiltSupported = supportsPanTilt(colorMode);

  function patch(partial: Partial<FixtureState>) {
    onChange({ ...current, ...partial });
  }

  const hex = rgbToHex(current.r, current.g, current.b);
  const sliderKinds: { kind: ChannelKind; label: string; key: keyof FixtureState; shown: boolean }[] = [
    { kind: "r", label: "红 R", key: "r", shown: colorSupported },
    { kind: "g", label: "绿 G", key: "g", shown: colorSupported },
    { kind: "b", label: "蓝 B", key: "b", shown: colorSupported },
    { kind: "w", label: "白 W", key: "w", shown: colorMode === "RGBW" },
    { kind: "dimmer", label: "亮度", key: "dimmer", shown: true },
    { kind: "target_x", label: "目标 X", key: "target_x", shown: panTiltSupported },
    { kind: "target_y", label: "目标 Y", key: "target_y", shown: panTiltSupported }
  ];

  return (
    <div className="min-w-0 flex-1 rounded-xl border border-edge bg-panel2 p-4">
      <div className="mb-3 flex items-center gap-2">
        <FixtureIcon type={fixture.fixture_type} size={28} active={Boolean(state)} />
        <div>
          <p className="font-mono text-sm text-slate-100">{fixture.fixture_code}</p>
          <DmxBadge address={fixture.dmx_address} channelCount={fixture.channel_count} />
        </div>
        {state ? (
          <span className="ml-auto flex items-center gap-1">
            <button type="button" className="btn" onClick={() => onChange(createEmptyFixtureState())}>
              黑场
            </button>
            <button type="button" className="btn" onClick={onExclude} title="从本场景中移除该灯具">
              移出
            </button>
          </span>
        ) : (
          <button type="button" className="btn-primary ml-auto" onClick={() => onChange(current)}>
            纳入本场景
          </button>
        )}
      </div>

      {state && (
        <div className="space-y-3">
          {colorSupported && (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={hex}
                onChange={(event) => {
                  const { r, g, b } = hexToRgb(event.target.value);
                  patch({ r, g, b });
                }}
                className="!h-9 !w-12 !cursor-pointer !border-0 !bg-transparent !p-0"
              />
              <span className="text-xs text-slate-400">取色器与下方 R/G/B 滑杆联动</span>
            </div>
          )}
          <div className="space-y-2">
            {sliderKinds
              .filter((item) => item.shown)
              .map((item) => (
                <ColorChannelSlider
                  key={item.key}
                  kind={item.kind}
                  label={item.label}
                  max={item.key === "target_x" || item.key === "target_y" ? 100 : 255}
                  value={current[item.key] as number}
                  onChange={(value) => patch({ [item.key]: value })}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
