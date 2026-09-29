import { useEffect, useMemo, useState } from "react";
import { PropertyPanel, Field } from "../../components/common/PropertyPanel";
import { ColorChannelSlider } from "../../components/common/ColorChannelSlider";
import { FIXTURE_TYPES, FixtureTypeText } from "../../constants/FixtureType";
import { CHANNEL_MODES, ChannelModeText, ChannelModeChannels } from "../../constants/ChannelMode";
import type { FixtureDraft } from "../../constructors/FixtureConstructor";
import type { Fixture } from "../../types/Fixture";
import type { FixtureType } from "../../types/FixtureType";
import type { ChannelMode } from "../../types/ChannelMode";

interface FixtureFormProps {
  mode: "create" | "edit";
  fixture?: Fixture;
  defaultAddress?: number;
  conflict?: Fixture | null;
  onDraftChange?: (draft: { id: string; dmx_address: number; channel_count: number } | null) => void;
  onCancel: () => void;
  onSubmit: (draft: FixtureDraft) => Promise<void>;
}

export function FixtureForm({
  mode,
  fixture,
  defaultAddress = 1,
  conflict,
  onDraftChange,
  onCancel,
  onSubmit
}: FixtureFormProps) {
  const [fixtureCode, setFixtureCode] = useState(fixture?.fixture_code ?? "");
  const [fixtureType, setFixtureType] = useState<FixtureType>(fixture?.fixture_type ?? "PAR");
  const [colorMode, setColorMode] = useState<ChannelMode>(fixture?.color_mode ?? "RGB");
  const [dmxAddress, setDmxAddress] = useState(fixture?.dmx_address ?? defaultAddress);
  const [autoChannels, setAutoChannels] = useState(fixture === undefined);
  const [channelCount, setChannelCount] = useState(
    fixture?.channel_count ?? ChannelModeChannels[fixture?.color_mode ?? "RGB"]
  );
  const [positionX, setPositionX] = useState(fixture?.position_x ?? 50);
  const [positionY, setPositionY] = useState(fixture?.position_y ?? 50);
  const [submitting, setSubmitting] = useState(false);

  const effectiveCount = autoChannels ? ChannelModeChannels[colorMode] : channelCount;

  const draft = useMemo(
    () => ({ id: fixture?.id ?? "__new-fixture__", dmx_address: dmxAddress, channel_count: effectiveCount }),
    [fixture?.id, dmxAddress, effectiveCount]
  );

  // 表单每次改动都把候选地址段同步给页面上的 DMX 通道条
  useEffect(() => {
    onDraftChange?.(draft);
    return () => onDraftChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id, draft.dmx_address, draft.channel_count]);

  return (
    <PropertyPanel
      title={mode === "create" ? "新增灯具" : `编辑 ${fixture?.fixture_code ?? ""}`}
      onClose={onCancel}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn flex-1" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={submitting || Boolean(conflict)}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onSubmit({
                  fixture_code: fixtureCode.trim(),
                  fixture_type: fixtureType,
                  position_x: positionX,
                  position_y: positionY,
                  dmx_address: dmxAddress,
                  color_mode: colorMode,
                  channel_count: effectiveCount
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {mode === "create" ? "上架灯具" : "保存修改"}
          </button>
        </div>
      }
    >
      <Field label="灯具编号">
        <input
          type="text"
          value={fixtureCode}
          placeholder="如 FACE-L-02"
          onChange={(event) => setFixtureCode(event.target.value)}
        />
      </Field>

      <Field label="灯具类型">
        <select value={fixtureType} onChange={(event) => setFixtureType(event.target.value as FixtureType)}>
          {FIXTURE_TYPES.map((type) => (
            <option key={type} value={type}>
              {FixtureTypeText[type]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="通道模式" hint="切换模式后默认通道数自动更新">
        <select
          value={colorMode}
          onChange={(event) => {
            const next = event.target.value as ChannelMode;
            setColorMode(next);
            setAutoChannels(true);
          }}
        >
          {CHANNEL_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {ChannelModeText[mode]}（{ChannelModeChannels[mode]} CH）
            </option>
          ))}
        </select>
      </Field>

      <Field label="DMX 起始地址（1-512）">
        <input
          type="number"
          min={1}
          max={512}
          value={dmxAddress}
          onChange={(event) => {
            setDmxAddress(Number(event.target.value));
          }}
        />
      </Field>

      <label className="flex items-center gap-2 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={autoChannels}
          onChange={(event) => setAutoChannels(event.target.checked)}
          className="!w-auto"
        />
        通道数跟随通道模式
      </label>
      {!autoChannels && (
        <Field label="通道数（手动）">
          <input
            type="number"
            min={1}
            max={512}
            value={channelCount}
            onChange={(event) => {
              setChannelCount(Number(event.target.value));
            }}
          />
        </Field>
      )}

      {conflict && (
        <p className="rounded border border-red-500/50 bg-red-500/10 px-2 py-1.5 text-xs text-red-300">
          地址段与 {conflict.fixture_code}（CH {conflict.dmx_address}-
          {conflict.dmx_address + conflict.channel_count - 1}）压线，请调整后再保存。
        </p>
      )}

      <div className="space-y-2 rounded-lg border border-edge bg-panel2 p-3">
        <p className="text-xs font-medium text-slate-300">灯位（舞台百分比）</p>
        <ColorChannelSlider kind="target_x" label="水平 X" value={positionX} max={100} onChange={setPositionX} />
        <ColorChannelSlider kind="target_y" label="纵深 Y" value={positionY} max={100} onChange={setPositionY} />
        <p className="text-[11px] text-slate-500">也可以直接在左侧平面图上拖动灯具。</p>
      </div>
    </PropertyPanel>
  );
}
